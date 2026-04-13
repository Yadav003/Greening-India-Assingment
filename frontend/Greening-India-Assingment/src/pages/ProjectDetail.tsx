import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import { tasksApi } from '../api/tasks'
import ErrorState from '../components/ErrorState'
import Loader from '../components/Loader'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import type { Project } from '../types/project'
import type { CreateTaskPayload, Task, TaskFormValues, UpdateTaskPayload } from '../types/task'
import { getErrorMessage } from '../utils/apiError'

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const taskModalValues = useMemo<TaskFormValues | undefined>(() => {
    if (!editingTask) {
      return undefined
    }

    return {
      title: editingTask.title,
      description: editingTask.description ?? '',
      dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : '',
      priority: editingTask.priority,
      status: editingTask.status,
    }
  }, [editingTask])

  const fetchProjectData = async () => {
    if (!id) {
      setError('Project id is missing in URL.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [projectResponse, tasksResponse] = await Promise.all([
        projectsApi.getProjectById(id),
        tasksApi.getTasksByProject(id),
      ])
      setProject(projectResponse)
      setTasks(tasksResponse)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load project details.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchProjectData()
  }, [id])

  const handleCreateClick = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      await tasksApi.deleteTask(taskId)
      setTasks((previous) => previous.filter((task) => task.id !== taskId))
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, 'Could not delete task.'))
    }
  }

  const handleTaskSubmit = async (values: TaskFormValues) => {
    if (!id) {
      return
    }

    setIsSubmittingTask(true)

    try {
      if (editingTask) {
        const payload: UpdateTaskPayload = {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate || undefined,
          status: values.status,
          priority: values.priority,
        }

        const updatedTask = await tasksApi.updateTask(editingTask.id, payload)
        setTasks((previous) =>
          previous.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        )
      } else {
        const payload: CreateTaskPayload = {
          title: values.title,
          description: values.description,
          dueDate: values.dueDate || undefined,
          priority: values.priority,
        }

        const createdTask = await tasksApi.createTask(id, payload)
        setTasks((previous) => [createdTask, ...previous])
      }

      setIsModalOpen(false)
      setEditingTask(null)
    } catch (submitError) {
      setError(getErrorMessage(submitError, 'Could not save task.'))
    } finally {
      setIsSubmittingTask(false)
    }
  }

  if (isLoading) {
    return <Loader label="Loading project details..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Project load failed"
        message={error}
        onRetry={() => {
          void fetchProjectData()
        }}
      />
    )
  }

  if (!project) {
    return (
      <ErrorState
        title="Project not found"
        message="This project does not exist or was removed."
      />
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Back to projects
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-600">{project.description}</p>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Add task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800">No tasks available</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first task to get this project moving.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleTaskEdit}
              onDelete={handleTaskDelete}
            />
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        title={editingTask ? 'Edit task' : 'Create task'}
        submitLabel={editingTask ? 'Update task' : 'Create task'}
        initialValues={taskModalValues}
        isSubmitting={isSubmittingTask}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleTaskSubmit}
      />
    </section>
  )
}

export default ProjectDetailPage
