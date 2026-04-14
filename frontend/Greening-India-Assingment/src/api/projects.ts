import { apiClient } from './client'
import type { CreateProjectPayload, Project } from '../types/project'

const mapProject = (rawProject: unknown): Project => {
  const value = (rawProject ?? {}) as Record<string, unknown>
  const createdAt =
    (typeof value.createdAt === 'string' && value.createdAt) ||
    (typeof value.created_at === 'string' && value.created_at) ||
    new Date().toISOString()
  const updatedAt =
    (typeof value.updatedAt === 'string' && value.updatedAt) ||
    (typeof value.updated_at === 'string' && value.updated_at) ||
    createdAt

  return {
    id: String(value.id ?? ''),
    name: typeof value.name === 'string' ? value.name : 'Untitled project',
    description: typeof value.description === 'string' ? value.description : '',
    createdAt,
    updatedAt,
    taskCount: typeof value.taskCount === 'number' ? value.taskCount : undefined,
    completedTaskCount:
      typeof value.completedTaskCount === 'number' ? value.completedTaskCount : undefined,
  }
}

export const projectsApi = {
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[] | { projects?: Project[] }>('/projects')
    const payload = response.data
    const projectList = Array.isArray(payload) ? payload : payload.projects ?? []
    return projectList.map(mapProject)
  },

  getProjectById: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<Project>(`/projects/${projectId}`)
    return mapProject(response.data)
  },

  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const response = await apiClient.post<Project>('/projects', payload)
    return mapProject(response.data)
  },

  deleteProject: async (projectId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}`)
  },
}
