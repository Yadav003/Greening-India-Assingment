import type { Task } from '../types/task'
import SelectField from './SelectField'
import { formatDate } from '../utils/date'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (task: Task, nextStatus: Task['status']) => void
  isDeleting?: boolean
  isUpdatingStatus?: boolean
}

const statusLabel: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

const statusClasses: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
}

const statusOptions = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
] as const

const priorityClasses: Record<Task['priority'], string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  medium: 'border-amber-200 bg-amber-50 text-amber-800',
  high: 'border-red-200 bg-red-50 text-red-800',
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isDeleting = false,
  isUpdatingStatus = false,
}: TaskCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{task.title}</h3>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[task.status]}`}
        >
          {statusLabel[task.status]}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {task.description && task.description.length > 0
          ? task.description
          : 'No description yet.'}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded border px-2 py-1 font-semibold capitalize ${priorityClasses[task.priority]}`}
        >
          {task.priority} priority
        </span>
        <span className="text-slate-500">Due: {formatDate(task.dueDate)}</span>
        <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
          {task.assignee ? `Assignee: ${task.assignee}` : 'Unassigned'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </span>
          <SelectField
            value={task.status}
            options={statusOptions}
            onChange={(nextStatus) => onStatusChange(task, nextStatus)}
            disabled={isUpdatingStatus || isDeleting}
          />
        </label>

        <button
          type="button"
          onClick={() => onEdit(task)}
          disabled={isDeleting || isUpdatingStatus}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          disabled={isDeleting || isUpdatingStatus}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  )
}

export default TaskCard
