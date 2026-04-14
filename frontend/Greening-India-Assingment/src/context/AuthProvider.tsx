import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authApi } from '../api/auth'
import { clearUnauthorizedHandler, registerUnauthorizedHandler } from '../api/client'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'
import { clearAuthState, loadAuthState, saveAuthState } from '../utils/storage'
import { AuthContext, type AuthContextValue } from './authContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialAuthState] = useState(() => loadAuthState())
  const [user, setUser] = useState<User | null>(initialAuthState?.user ?? null)
  const [token, setToken] = useState<string | null>(initialAuthState?.token ?? null)
  const [isInitializing, setIsInitializing] = useState(Boolean(initialAuthState?.token))

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
    setIsInitializing(false)
    clearAuthState()
  }, [])

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      logout()

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    })

    return () => {
      clearUnauthorizedHandler()
    }
  }, [logout])

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    authApi
      .me()
      .then((profile) => {
        if (!isMounted) {
          return
        }

        setUser(profile)
        saveAuthState({ user: profile, token })
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        logout()
      })
      .finally(() => {
        if (!isMounted) {
          return
        }

        setIsInitializing(false)
      })

    return () => {
      isMounted = false
    }
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
