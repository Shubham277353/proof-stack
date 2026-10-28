import type { AuthResponse, ProfileFormData } from '../types/auth'
import type { Project, ProjectFormData } from '../types/project'
import type { Evidence, EvidenceFormData } from '../types/evidence'
import type { Skill, SkillClaim, ClaimFormData } from '../types/skill'
import type { ReviewRequest, ReviewUser } from '../types/review'
import type { Portfolio } from '../types/portfolio'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('ps_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  }
  const res = await fetch(`/api${path}`, { ...options, headers })
  const data: unknown = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? 'Something went wrong'
    throw new Error(msg)
  }
  return data as T
}

async function requestEmpty(path: string, options?: RequestInit): Promise<void> {
  const token = localStorage.getItem('ps_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`/api${path}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(data.error ?? 'Something went wrong')
  }
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request<{ user: AuthResponse['user'] }>('/auth/me'),
  updateProfile: (data: Partial<ProfileFormData>) =>
    request<{ user: AuthResponse['user'] }>('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects: () => request<{ projects: Project[] }>('/projects'),
  getProject: (id: string) => request<{ project: Project }>(`/projects/${id}`),
  createProject: (data: ProjectFormData) =>
    request<{ project: Project }>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<ProjectFormData>) =>
    request<{ project: Project }>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => requestEmpty(`/projects/${id}`, { method: 'DELETE' }),

  // ── Evidence ──────────────────────────────────────────────────────────────
  getEvidence: (projectId: string) => request<{ evidence: Evidence[] }>(`/projects/${projectId}/evidence`),
  createEvidence: (projectId: string, data: EvidenceFormData) =>
    request<{ evidence: Evidence }>(`/projects/${projectId}/evidence`, { method: 'POST', body: JSON.stringify(data) }),
  updateEvidence: (projectId: string, evidenceId: string, data: Partial<EvidenceFormData>) =>
    request<{ evidence: Evidence }>(`/projects/${projectId}/evidence/${evidenceId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEvidence: (projectId: string, evidenceId: string) =>
    requestEmpty(`/projects/${projectId}/evidence/${evidenceId}`, { method: 'DELETE' }),

  // ── Skills ────────────────────────────────────────────────────────────────
  getSkills: () => request<{ skills: Skill[] }>('/skills'),

  // ── Claims ────────────────────────────────────────────────────────────────
  getClaims: () => request<{ claims: SkillClaim[] }>('/claims'),
  createClaim: (data: ClaimFormData) =>
    request<{ claim: SkillClaim }>('/claims', { method: 'POST', body: JSON.stringify(data) }),
  updateClaim: (id: string, data: Partial<ClaimFormData>) =>
    request<{ claim: SkillClaim }>(`/claims/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClaim: (id: string) => requestEmpty(`/claims/${id}`, { method: 'DELETE' }),

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers: () => request<{ users: ReviewUser[] }>('/users'),

  // ── Reviews ───────────────────────────────────────────────────────────────
  getReviews: () => request<{ requests: ReviewRequest[] }>('/reviews'),
  createReviewRequest: (claimId: string, reviewerId: string, message: string) =>
    request<{ request: ReviewRequest }>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ claimId, reviewerId, message }),
    }),
  respondToRequest: (id: string, status: 'ACCEPTED' | 'DECLINED') =>
    request<{ request: ReviewRequest }>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  submitReview: (
    requestId: string,
    data: { feedback: string; scoreDepth: number; scoreClarity: number; scoreEvidence: number; scoreOverall: number }
  ) =>
    request<{ request: ReviewRequest }>(`/reviews/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Portfolio ─────────────────────────────────────────────────────────────
  getPortfolio: (username: string) =>
    request<{ portfolio: Portfolio }>(`/portfolio/${username}`),
}
