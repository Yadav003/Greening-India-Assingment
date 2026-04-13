import type { Task } from '../types/task'
import { formatDate } from '../utils/date'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const statusLabel: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

const statusClasses: Record<Task['status'], string> = {
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded bg-slate-100 px-2 py-1 font-medium text-slate-700">
          Priority: {task.priority}
        </span>
        <span>Due: {formatDate(task.dueDate)}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default TaskCard
