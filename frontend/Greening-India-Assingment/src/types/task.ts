export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  updatedAt: string
}

export interface CreateTaskPayload {
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  status?: TaskStatus
  priority: TaskPriority
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  assignee?: string
  dueDate?: string
  status?: TaskStatus
  priority?: TaskPriority
}

export interface TaskFormValues {
  title: string
  description: string
  assignee: string
  dueDate: string
  priority: TaskPriority
  status: TaskStatus
}

export type TaskStatusFilter = 'all' | TaskStatus
