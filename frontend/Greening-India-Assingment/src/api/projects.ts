import { apiClient } from './client'
import type { CreateProjectPayload, Project } from '../types/project'

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/projects')
    return response.data
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${projectId}`)
    return response.data
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', payload)
    return response.data
  },
}
