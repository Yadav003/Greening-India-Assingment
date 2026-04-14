import axios from 'axios'
import { loadAuthState } from '../utils/storage'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

let unauthorizedHandler: (() => void) | null = null

export const registerUnauthorizedHandler = (handler: () => void): void => {
  unauthorizedHandler = handler
}

export const clearUnauthorizedHandler = (): void => {
  unauthorizedHandler = null
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const authState = loadAuthState()

  if (authState?.token) {
    if (config.headers?.set) {
      config.headers.set('Authorization', `Bearer ${authState.token}`)
    } else {
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${authState.token}`
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      unauthorizedHandler?.()
    }

    return Promise.reject(error)
  },
)
