import axios from 'axios'
import { loadAuthState } from '../utils/storage'

const API_BASE_URL = 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const authState = loadAuthState()

  if (authState?.token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${authState.token}`,
    }
  }

  return config
})
