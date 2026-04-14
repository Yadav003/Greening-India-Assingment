const crypto = require('crypto')
const path = require('path')
const jsonServer = require('json-server')

const DB_FILE = path.join(__dirname, 'db.json')
const PORT = 4000

const server = jsonServer.create()
const router = jsonServer.router(DB_FILE)
const middlewares = jsonServer.defaults()

server.use(jsonServer.bodyParser)
server.use(middlewares)

const db = router.db

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user
  return safeUser
}

const getNow = () => new Date().toISOString()

const getId = () => {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const createToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    issuedAt: Date.now(),
  }

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

const parseToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

const isStatusValid = (status) => ['todo', 'in_progress', 'done'].includes(status)
const isPriorityValid = (priority) => ['low', 'medium', 'high'].includes(priority)

const toSafeTask = (task) => ({
  id: String(task.id),
  projectId: String(task.projectId),
  title: task.title,
  description: typeof task.description === 'string' ? task.description : '',
  status: isStatusValid(task.status) ? task.status : 'todo',
  priority: isPriorityValid(task.priority) ? task.priority : 'medium',
  assignee: typeof task.assignee === 'string' ? task.assignee : '',
  dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
  createdAt: task.createdAt || getNow(),
  updatedAt: task.updatedAt || task.createdAt || getNow(),
})

const withProjectStats = (project, tasks) => {
  const projectTasks = tasks.filter((task) => String(task.projectId) === String(project.id))
  const completedTaskCount = projectTasks.filter((task) => task.status === 'done').length

  return {
    id: String(project.id),
    name: project.name,
    description: typeof project.description === 'string' ? project.description : '',
    ownerId: String(project.ownerId),
    createdAt: project.createdAt || getNow(),
    updatedAt: project.updatedAt || project.createdAt || getNow(),
    taskCount: projectTasks.length,
    completedTaskCount,
  }
}

const authMiddleware = (req, res, next) => {
  if (req.path === '/auth/login' || req.path === '/auth/register') {
    return next()
  }

  const authorization = req.headers.authorization

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const token = authorization.slice(7).trim()
  const tokenPayload = parseToken(token)

  if (!tokenPayload?.userId || !tokenPayload?.email) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const user = db
    .get('users')
    .find({ id: tokenPayload.userId, email: tokenPayload.email })
    .value()

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  req.user = user
  return next()
}

const canAccessProject = (projectId, user) => {
  const project = db.get('projects').find({ id: projectId }).value()

  if (!project) {
    return false
  }

  if (project.ownerId === user.id) {
    return true
  }

  const hasAssignedTask = db
    .get('tasks')
    .some(
      (task) =>
        String(task.projectId) === String(projectId) &&
        (task.assignee === user.name || task.assignee === user.email),
    )
    .value()

  return Boolean(hasAssignedTask)
}

server.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

server.post('/auth/register', (req, res) => {
  const { name, email, password } = req.body || {}
  const fields = {}

  if (typeof name !== 'string' || name.trim().length < 2) {
    fields.name = 'must be at least 2 characters'
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    fields.email = 'is invalid'
  }

  if (typeof password !== 'string' || password.length < 6) {
    fields.password = 'must be at least 6 characters'
  }

  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'validation failed', fields })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = db.get('users').find({ email: normalizedEmail }).value()

  if (existingUser) {
    return res.status(400).json({
      error: 'validation failed',
      fields: { email: 'already registered' },
    })
  }

  const now = getNow()
  const user = {
    id: getId(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: now,
  }

  db.get('users').push(user).write()

  return res.status(201).json({
    token: createToken(user),
    user: sanitizeUser(user),
  })
})

server.post('/auth/login', (req, res) => {
  const { email, password } = req.body || {}

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      error: 'validation failed',
      fields: {
        email: 'is required',
        password: 'is required',
      },
    })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = db.get('users').find({ email: normalizedEmail }).value()

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'invalid credentials' })
  }

  return res.status(200).json({
    token: createToken(user),
    user: sanitizeUser(user),
  })
})

server.use(authMiddleware)

server.get('/auth/me', (req, res) => {
  res.json(sanitizeUser(req.user))
})

server.get('/projects', (req, res) => {
  const projects = db.get('projects').value()
  const tasks = db.get('tasks').value()

  const availableProjects = projects
    .filter((project) => canAccessProject(project.id, req.user))
    .map((project) => withProjectStats(project, tasks))

  res.json({ projects: availableProjects })
})

server.post('/projects', (req, res) => {
  const { name, description } = req.body || {}

  if (typeof name !== 'string' || name.trim().length < 3) {
    return res.status(400).json({
      error: 'validation failed',
      fields: { name: 'must be at least 3 characters' },
    })
  }

  const now = getNow()
  const project = {
    id: getId(),
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    ownerId: req.user.id,
    createdAt: now,
    updatedAt: now,
  }

  db.get('projects').push(project).write()

  res.status(201).json(withProjectStats(project, []))
})

server.get('/projects/:id', (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value()

  if (!project) {
    return res.status(404).json({ error: 'not found' })
  }

  if (!canAccessProject(req.params.id, req.user)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const tasks = db.get('tasks').value()
  return res.json(withProjectStats(project, tasks))
})

server.delete('/projects/:id', (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value()

  if (!project) {
    return res.status(404).json({ error: 'not found' })
  }

  if (String(project.ownerId) !== String(req.user.id)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  db.get('tasks')
    .remove((task) => String(task.projectId) === String(req.params.id))
    .write()

  db.get('projects').remove({ id: req.params.id }).write()

  return res.status(204).send()
})

server.get('/projects/:id/tasks', (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value()

  if (!project) {
    return res.status(404).json({ error: 'not found' })
  }

  if (!canAccessProject(req.params.id, req.user)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  let projectTasks = db
    .get('tasks')
    .filter((task) => String(task.projectId) === String(req.params.id))
    .value()

  if (typeof req.query.status === 'string' && req.query.status.length > 0) {
    projectTasks = projectTasks.filter((task) => task.status === req.query.status)
  }

  if (typeof req.query.assignee === 'string' && req.query.assignee.length > 0) {
    projectTasks = projectTasks.filter((task) => task.assignee === req.query.assignee)
  }

  res.json({ tasks: projectTasks.map(toSafeTask) })
})

server.post('/projects/:id/tasks', (req, res) => {
  const project = db.get('projects').find({ id: req.params.id }).value()

  if (!project) {
    return res.status(404).json({ error: 'not found' })
  }

  if (!canAccessProject(req.params.id, req.user)) {
    return res.status(403).json({ error: 'forbidden' })
  }

  const { title, description, assignee, dueDate, status, priority } = req.body || {}
  const fields = {}

  if (typeof title !== 'string' || title.trim().length < 3) {
    fields.title = 'must be at least 3 characters'
  }

  if (priority !== undefined && !isPriorityValid(priority)) {
    fields.priority = 'must be one of low, medium, high'
  }

  if (status !== undefined && !isStatusValid(status)) {
    fields.status = 'must be one of todo, in_progress, done'
  }

  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'validation failed', fields })
  }

  const now = getNow()
  const task = {
    id: getId(),
    projectId: req.params.id,
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    assignee: typeof assignee === 'string' ? assignee.trim() : '',
    dueDate: typeof dueDate === 'string' ? dueDate : '',
    status: status || 'todo',
    priority: priority || 'medium',
    createdAt: now,
    updatedAt: now,
    createdBy: req.user.id,
  }

  db.get('tasks').push(task).write()
  res.status(201).json(toSafeTask(task))
})

server.patch('/tasks/:id', (req, res) => {
  const existingTask = db.get('tasks').find({ id: req.params.id }).value()

  if (!existingTask) {
    return res.status(404).json({ error: 'not found' })
  }

  const fields = {}

  if (req.body.title !== undefined) {
    if (typeof req.body.title !== 'string' || req.body.title.trim().length < 3) {
      fields.title = 'must be at least 3 characters'
    }
  }

  if (req.body.status !== undefined && !isStatusValid(req.body.status)) {
    fields.status = 'must be one of todo, in_progress, done'
  }

  if (req.body.priority !== undefined && !isPriorityValid(req.body.priority)) {
    fields.priority = 'must be one of low, medium, high'
  }

  if (Object.keys(fields).length > 0) {
    return res.status(400).json({ error: 'validation failed', fields })
  }

  const updatedTask = {
    ...existingTask,
    ...req.body,
    title: req.body.title !== undefined ? req.body.title.trim() : existingTask.title,
    description:
      req.body.description !== undefined
        ? String(req.body.description).trim()
        : existingTask.description,
    assignee: req.body.assignee !== undefined ? String(req.body.assignee).trim() : existingTask.assignee,
    updatedAt: getNow(),
  }

  db.get('tasks').find({ id: req.params.id }).assign(updatedTask).write()
  return res.json(toSafeTask(updatedTask))
})

server.delete('/tasks/:id', (req, res) => {
  const existingTask = db.get('tasks').find({ id: req.params.id }).value()

  if (!existingTask) {
    return res.status(404).json({ error: 'not found' })
  }

  db.get('tasks').remove({ id: req.params.id }).write()
  return res.status(204).send()
})

server.use(router)

server.listen(PORT, () => {
  process.stdout.write(`Mock API running on http://localhost:${PORT}\n`)
})
