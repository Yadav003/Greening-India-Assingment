import { apiClient } from './client'
import type {
  CreateTaskPayload,
  Task,
  TaskStatus,
  UpdateTaskPayload,
} from '../types/task'

interface TaskQueryFilters {
  status?: TaskStatus
  assignee?: string
}

const mapTask = (rawTask: unknown): Task => {
  const value = (rawTask ?? {}) as Record<string, unknown>
  const createdAt =
    (typeof value.createdAt === 'string' && value.createdAt) ||
    (typeof value.created_at === 'string' && value.created_at) ||
    new Date().toISOString()

  return {
    id: String(value.id ?? ''),
    projectId: String(value.projectId ?? value.project_id ?? ''),
    title: typeof value.title === 'string' ? value.title : 'Untitled task',
    description: typeof value.description === 'string' ? value.description : undefined,
    assignee: typeof value.assignee === 'string' ? value.assignee : undefined,
    dueDate:
      (typeof value.dueDate === 'string' && value.dueDate) ||
      (typeof value.due_date === 'string' && value.due_date) ||
      undefined,
    status:
      value.status === 'todo' || value.status === 'in_progress' || value.status === 'done'
        ? value.status
        : 'todo',
    priority: value.priority === 'low' || value.priority === 'medium' || value.priority === 'high'
      ? value.priority
      : 'medium',
    createdAt,
    updatedAt:
      (typeof value.updatedAt === 'string' && value.updatedAt) ||
      (typeof value.updated_at === 'string' && value.updated_at) ||
      createdAt,
  }
}

export const tasksApi = {
  getTasksByProject: async (
    projectId: string,
    filters?: TaskQueryFilters,
  ): Promise<Task[]> => {
    const response = await apiClient.get<Task[] | { tasks?: Task[] }>(
      `/projects/${projectId}/tasks`,
      {
        params: filters,
      },
    )

    const payload = response.data
    const taskList = Array.isArray(payload) ? payload : payload.tasks ?? []
    return taskList.map(mapTask)
  },

  createTask: async (
    projectId: string,
    payload: CreateTaskPayload,
  ): Promise<Task> => {
    const response = await apiClient.post<Task>(
      `/projects/${projectId}/tasks`,
      payload,
    )
    return mapTask(response.data)
  },

  updateTask: async (taskId: string, payload: UpdateTaskPayload): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, payload)
    return mapTask(response.data)
  },

  deleteTask: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`)
  },
}
