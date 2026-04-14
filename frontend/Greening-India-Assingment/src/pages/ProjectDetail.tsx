import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import { tasksApi } from '../api/tasks'
import ErrorState from '../components/ErrorState'
import Loader from '../components/Loader'
import SelectField from '../components/SelectField'
import TaskCard from '../components/TaskCard'
import TaskModal from '../components/TaskModal'
import ToastStack from '../components/ToastStack'
import { useToast } from '../hooks/useToast'
import type { Project } from '../types/project'
import type {
  CreateTaskPayload,
  Task,
  TaskFormValues,
  TaskStatusFilter,
  UpdateTaskPayload,
} from '../types/task'
import { getErrorMessage } from '../utils/apiError'

function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalVersion, setModalVersion] = useState(0)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [deletingTaskIds, setDeletingTaskIds] = useState<Record<string, boolean>>({})
  const [updatingStatusTaskIds, setUpdatingStatusTaskIds] = useState<Record<string, boolean>>({})
  const { toasts, showToast, removeToast } = useToast()

  const taskModalValues = useMemo<TaskFormValues | undefined>(() => {
    if (!editingTask) {
      return undefined
    }

    return {
      title: editingTask.title,
      description: editingTask.description ?? '',
      assignee: editingTask.assignee ?? '',
      dueDate: editingTask.dueDate ? editingTask.dueDate.slice(0, 10) : '',
      priority: editingTask.priority,
      status: editingTask.status,
    }
  }, [editingTask])

  const assigneeOptions = useMemo(() => {
    const values = tasks
      .map((task) => task.assignee?.trim() ?? '')
      .filter((value, index, allValues) => value.length > 0 && allValues.indexOf(value) === index)

    return values.sort((first, second) => first.localeCompare(second))
  }, [tasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch = statusFilter === 'all' || task.status === statusFilter
      const assigneeMatch = assigneeFilter === 'all' || (task.assignee ?? '') === assigneeFilter
      return statusMatch && assigneeMatch
    })
  }, [tasks, statusFilter, assigneeFilter])

  const statusFilterOptions: Array<{ value: TaskStatusFilter; label: string }> = [
    { value: 'all', label: 'All statuses' },
    { value: 'todo', label: 'To do' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'done', label: 'Done' },
  ]

  const assigneeFilterOptions = [
    { value: 'all', label: 'All assignees' },
    ...assigneeOptions.map((assignee) => ({ value: assignee, label: assignee })),
  ]

  const fetchProjectData = useCallback(async () => {
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
      setTasks(Array.isArray(tasksResponse) ? tasksResponse : [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not load project details.'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchProjectData()
  }, [fetchProjectData])

  const handleCreateClick = useCallback(() => {
    setEditingTask(null)
    setModalVersion((previous) => previous + 1)
    setIsModalOpen(true)
  }, [])

  const handleTaskEdit = useCallback((task: Task) => {
    setEditingTask(task)
    setModalVersion((previous) => previous + 1)
    setIsModalOpen(true)
  }, [])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    setDeletingTaskIds((previous) => ({ ...previous, [taskId]: true }))

    try {
      await tasksApi.deleteTask(taskId)
      setTasks((previous) => previous.filter((task) => task.id !== taskId))
      showToast({
        variant: 'success',
        title: 'Task removed',
        message: 'The task was deleted successfully.',
      })
    } catch (deleteError) {
      showToast({
        variant: 'error',
        title: 'Delete failed',
        message: getErrorMessage(deleteError, 'Could not delete task.'),
      })
    } finally {
      setDeletingTaskIds((previous) => {
        const next = { ...previous }
        delete next[taskId]
        return next
      })
    }
  }, [showToast])

  const handleTaskStatusChange = useCallback(
    async (task: Task, nextStatus: Task['status']) => {
      if (task.status === nextStatus) {
        return
      }

      const previousStatus = task.status

      setUpdatingStatusTaskIds((previous) => ({ ...previous, [task.id]: true }))
      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item,
        ),
      )

      try {
        const updatedTask = await tasksApi.updateTask(task.id, { status: nextStatus })
        setTasks((previous) =>
          previous.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
        )
      } catch (updateError) {
        setTasks((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: previousStatus,
                }
              : item,
          ),
        )

        showToast({
          variant: 'error',
          title: 'Status update failed',
          message: getErrorMessage(updateError, 'Could not update task status.'),
        })
      } finally {
        setUpdatingStatusTaskIds((previous) => {
          const next = { ...previous }
          delete next[task.id]
          return next
        })
      }
    },
    [showToast],
  )

  const handleTaskSubmit = useCallback(async (values: TaskFormValues) => {
    if (!id) {
      return
    }

    setIsSubmittingTask(true)

    try {
      if (editingTask) {
        const payload: UpdateTaskPayload = {
          title: values.title,
          description: values.description,
          assignee: values.assignee || undefined,
          dueDate: values.dueDate || undefined,
          status: values.status,
          priority: values.priority,
        }

        const updatedTask = await tasksApi.updateTask(editingTask.id, payload)
        setTasks((previous) =>
          previous.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
        )
        showToast({
          variant: 'success',
          title: 'Task updated',
          message: `${updatedTask.title} was updated.`,
        })
      } else {
        const payload: CreateTaskPayload = {
          title: values.title,
          description: values.description,
          assignee: values.assignee || undefined,
          dueDate: values.dueDate || undefined,
          status: values.status,
          priority: values.priority,
        }

        const createdTask = await tasksApi.createTask(id, payload)
        setTasks((previous) => [createdTask, ...previous])
        showToast({
          variant: 'success',
          title: 'Task created',
          message: `${createdTask.title} is now in your board.`,
        })
      }

      setIsModalOpen(false)
      setEditingTask(null)
    } catch (submitError) {
      showToast({
        variant: 'error',
        title: 'Save failed',
        message: getErrorMessage(submitError, 'Could not save task.'),
      })
    } finally {
      setIsSubmittingTask(false)
    }
  }, [editingTask, id, showToast])

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
      <ToastStack toasts={toasts} onDismiss={removeToast} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/projects" className="text-sm font-medium text-slate-500 hover:text-slate-700">
            Back to projects
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-600">{project.description || 'No project description provided.'}</p>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Add task
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <SelectField
            value={statusFilter}
            options={statusFilterOptions}
            onChange={setStatusFilter}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Assignee
          </span>
          <SelectField
            value={assigneeFilter}
            options={assigneeFilterOptions}
            onChange={setAssigneeFilter}
          />
        </label>

        <div className="flex items-end text-sm text-slate-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800">No tasks yet</h2>
          <p className="mt-1 text-sm text-slate-600">Create your first task to get this project moving.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-800">No matching tasks</h2>
          <p className="mt-1 text-sm text-slate-600">Try changing status or assignee filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleTaskEdit}
              onDelete={handleTaskDelete}
              onStatusChange={handleTaskStatusChange}
              isDeleting={Boolean(deletingTaskIds[task.id])}
              isUpdatingStatus={Boolean(updatingStatusTaskIds[task.id])}
            />
          ))}
        </div>
      )}

      <TaskModal
        key={`${editingTask?.id ?? 'create'}-${modalVersion}`}
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
