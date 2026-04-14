import type { ToastItem } from '../hooks/useToast'

interface ToastStackProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastItem['variant'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-slate-200 bg-white text-slate-900',
}

function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(92vw,24rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-sm ${variantStyles[toast.variant]}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.message && <p className="mt-0.5 text-xs opacity-80">{toast.message}</p>}
            </div>

            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-1 text-xs opacity-70 transition hover:bg-black/5 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ToastStack
