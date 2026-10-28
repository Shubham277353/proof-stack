export interface Evidence {
  id: string
  title: string
  description: string | null
  url: string | null
  createdAt: string
  updatedAt: string
}

export interface EvidenceFormData {
  title: string
  description: string
  url: string
}
