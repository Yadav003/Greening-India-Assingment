interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

function ErrorState({
  title = 'Something failed',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorState
