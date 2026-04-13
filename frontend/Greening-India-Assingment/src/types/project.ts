export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  taskCount?: number
  completedTaskCount?: number
}

export interface CreateProjectPayload {
  name: string
  description: string
}
