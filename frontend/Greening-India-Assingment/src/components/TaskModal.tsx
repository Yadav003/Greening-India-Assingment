import { useEffect, useState } from 'react'
import type { TaskFormValues, TaskPriority, TaskStatus } from '../types/task'

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
  dueDate: '',
  priority: 'medium',
  status: 'todo',
}

function TaskModal({
  isOpen,
  title,
  submitLabel,
  initialValues,
  isSubmitting = false,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [formValues, setFormValues] = useState<TaskFormValues>(defaultTaskValues)

  useEffect(() => {
    if (isOpen) {
      setFormValues(initialValues ?? defaultTaskValues)
    }
  }, [isOpen, initialValues])

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
    await onSubmit(formValues)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={formValues.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Due date</span>
              <input
                type="date"
                value={formValues.dueDate}
                onChange={(event) => updateField('dueDate', event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priority</span>
              <select
                value={formValues.priority}
                onChange={(event) =>
                  updateField('priority', event.target.value as TaskPriority)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select
                value={formValues.status}
                onChange={(event) =>
                  updateField('status', event.target.value as TaskStatus)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

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
