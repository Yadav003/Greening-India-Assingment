interface LoaderProps {
  label?: string
}

function Loader({ label = 'Loading...' }: LoaderProps) {
  return (
    <div className="flex min-h-[260px] w-full items-center justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  )
}

export default Loader
