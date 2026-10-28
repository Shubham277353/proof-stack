export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface Project {
  id: string
  title: string
  description: string | null
  repoUrl: string | null
  liveUrl: string | null
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectFormData {
  title: string
  description: string
  repoUrl: string
  liveUrl: string
  status: ProjectStatus
}
