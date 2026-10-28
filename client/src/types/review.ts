import type { ClaimLevel, ClaimStatus, Skill } from './skill'

export type ReviewRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'COMPLETED'

export interface ReviewUser {
  id: string
  name: string
  email: string
}

export interface ReviewClaim {
  id: string
  level: ClaimLevel
  status: ClaimStatus
  summary: string | null
  skill: Skill
}

export interface Review {
  id: string
  feedback: string
  scoreDepth: number
  scoreClarity: number
  scoreEvidence: number
  scoreOverall: number
  createdAt: string
  updatedAt: string
}

export interface ReviewRequest {
  id: string
  status: ReviewRequestStatus
  message: string | null
  createdAt: string
  updatedAt: string
  requester: ReviewUser
  reviewer: ReviewUser
  claim: ReviewClaim
  review: Review | null
}
