import { useState } from 'react'
import SelectField from './SelectField'
import type { TaskFormValues, TaskPriority, TaskStatus } from '../types/task'
import { hasMinLength } from '../utils/validation'

interface TaskModalProps {
  isOpen: boolean
  title: string
  submitLabel: string
  initialValues?: TaskFormValues
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (values: TaskFormValues) => Promise<void>
}

const defaultTaskValues: TaskFormValues = {
  title: '',
  description: '',
  assignee: '',
  dueDate: '',
  priority: 'medium',
  status: 'todo',
}

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const statusOptions: Array<{ value: TaskStatus; label: string }> = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
]

function TaskModal({
  isOpen,
  title,
  submitLabel,
  initialValues,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(
    initialValues ?? defaultTaskValues,
  )
  const [formError, setFormError] = useState<string | null>(null)

  if (!isOpen) {
    return null
  }

  const updateField = <K extends keyof TaskFormValues>(
    key: K,
    value: TaskFormValues[K],
  ) => {
    setFormValues((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!hasMinLength(formValues.title, 3)) {
      setFormError('Task title must be at least 3 characters.')
      return
    }

    if (formValues.assignee.trim().length > 0 && !hasMinLength(formValues.assignee, 2)) {
      setFormError('Assignee name must be at least 2 characters when provided.')
      return
    }

    setFormError(null)
    await onSubmit(formValues)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input
              type="text"
              required
              value={formValues.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={formValues.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
              <input
                type="text"
                value={formValues.assignee}
                onChange={(event) => updateField('assignee', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                placeholder="Priya Sharma"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Due date</span>
              <input
                type="date"
                value={formValues.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priority</span>
              <SelectField
                value={formValues.priority}
                options={priorityOptions}
                onChange={(nextPriority) => updateField('priority', nextPriority)}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <SelectField
                value={formValues.status}
                options={statusOptions}
                onChange={(nextStatus) => updateField('status', nextStatus)}
              />
            </label>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskModal
