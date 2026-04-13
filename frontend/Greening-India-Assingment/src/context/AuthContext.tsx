import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authApi } from '../api/auth'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'
import { clearAuthState, loadAuthState, saveAuthState } from '../utils/storage'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialAuthState] = useState(() => loadAuthState())
  const [user, setUser] = useState<User | null>(initialAuthState?.user ?? null)
  const [token, setToken] = useState<string | null>(initialAuthState?.token ?? null)
  const isInitializing = false

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    setUser(response.user)
    setToken(response.token)
    saveAuthState({ user: response.user, token: response.token })
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload)
    setUser(response.user)
    setToken(response.token)
    saveAuthState({ user: response.user, token: response.token })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    clearAuthState()
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }

    authApi
      .me()
      .then((profile) => {
        setUser(profile)
        saveAuthState({ user: profile, token })
      })
      .catch(() => {
        logout()
      })
  }, [token, logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      register,
      logout,
    }),
    [user, token, isInitializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
