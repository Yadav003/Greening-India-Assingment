import type { User } from '../types/auth'

const AUTH_STORAGE_KEY = 'taskflow_auth'

export interface PersistedAuthState {
  user: User
  token: string
}

export const loadAuthState = (): PersistedAuthState | null => {
  const rawState = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawState) {
    return null
  }

  try {
    return JSON.parse(rawState) as PersistedAuthState
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const saveAuthState = (authState: PersistedAuthState): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState))
}

export const clearAuthState = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
