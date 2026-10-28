export interface Skill {
  id: string
  name: string
  category: string | null
}

export type ClaimLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

export interface ClaimEvidence {
  evidence: {
    id: string
    title: string
    url: string | null
  }
}

export interface SkillClaim {
  id: string
  level: ClaimLevel
  status: ClaimStatus
  summary: string | null
  createdAt: string
  updatedAt: string
  skill: Skill
  evidenceLinks: ClaimEvidence[]
}

export interface ClaimFormData {
  skillId: string
  level: ClaimLevel
  summary: string
  evidenceIds: string[]
}
