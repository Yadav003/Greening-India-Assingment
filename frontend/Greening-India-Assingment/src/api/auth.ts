import { apiClient } from './client'
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth'

const mapUser = (rawUser: unknown): User => {
  const value = (rawUser ?? {}) as Partial<User>

  return {
    id: String(value.id ?? ''),
    name: typeof value.name === 'string' && value.name.trim().length > 0 ? value.name : 'User',
    email: typeof value.email === 'string' ? value.email : '',
  }
}

const mapAuthResponse = (rawData: unknown): AuthResponse => {
  const value = (rawData ?? {}) as Partial<AuthResponse>

  if (typeof value.token !== 'string' || value.token.length === 0) {
    throw new Error('Authentication token is missing in the response.')
  }

  return {
    token: value.token,
    user: mapUser(value.user),
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload)
    return mapAuthResponse(response.data)
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload)
    return mapAuthResponse(response.data)
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me')
    const value = response.data as User | { user?: User }

    if ('user' in value && value.user) {
      return mapUser(value.user)
    }

    return mapUser(value)
  },
}
