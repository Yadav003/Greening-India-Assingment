import { apiClient } from './client'
import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/task'

export const tasksApi = {
  getTasksByProject: async (projectId: string): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/projects/${projectId}/tasks`)
    return response.data
  },

  createTask: async (
    projectId: string,
    payload: CreateTaskPayload,
  ): Promise<Task> => {
    const response = await apiClient.post<Task>(
      `/projects/${projectId}/tasks`,
      payload,
    )
    return response.data
  },

  updateTask: async (taskId: string, payload: UpdateTaskPayload): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, payload)
    return response.data
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`)
  },
}
