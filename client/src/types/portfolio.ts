import type { ClaimLevel, ClaimStatus } from './skill'

export interface PortfolioEvidence {
  id: string
  title: string
  description: string | null
  url: string | null
}

export interface PortfolioProject {
  id: string
  title: string
  description: string | null
  repoUrl: string | null
  liveUrl: string | null
  status: 'PUBLISHED'
  createdAt: string
  evidence: PortfolioEvidence[]
}

export interface PortfolioReview {
  scoreDepth: number
  scoreClarity: number
  scoreEvidence: number
  scoreOverall: number
  feedback: string
  createdAt: string
  reviewRequest: {
    reviewer: { name: string; displayName: string | null }
  }
}

export interface PortfolioReviewRequest {
  id: string
  review: PortfolioReview | null
}

export interface PortfolioClaim {
  id: string
  level: ClaimLevel
  status: ClaimStatus
  summary: string | null
  skill: { id: string; name: string; category: string | null }
  evidenceLinks: { evidence: { id: string; title: string; url: string | null } }[]
  reviewRequests: PortfolioReviewRequest[]
}

export interface Portfolio {
  id: string
  name: string
  displayName: string | null
  username: string
  bio: string | null
  createdAt: string
  projects: PortfolioProject[]
  skillClaims: PortfolioClaim[]
}
