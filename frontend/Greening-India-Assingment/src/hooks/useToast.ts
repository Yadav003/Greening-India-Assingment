import { useCallback, useState } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  title: string
  message?: string
  variant: ToastVariant
}

interface ShowToastOptions {
  title: string
  message?: string
  variant?: ToastVariant
  durationMs?: number
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    ({ title, message, variant = 'info', durationMs = 3200 }: ShowToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const nextToast: ToastItem = { id, title, message, variant }

      setToasts((previous) => [...previous, nextToast])

      window.setTimeout(() => {
        removeToast(id)
      }, durationMs)
    },
    [removeToast],
  )

  return { toasts, showToast, removeToast }
}
