import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Portfolio, PortfolioClaim } from '../types/portfolio'

const LEVEL_ORDER = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2, EXPERT: 3 }
const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}
const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-green-900/30 text-green-400 border-green-800/40',
  UNDER_REVIEW: 'bg-amber-900/30 text-amber-light border-amber-800/40',
  SUBMITTED: 'bg-navy-800 text-ivory-300/60 border-navy-700',
}

function ScoreDots({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= value ? 'bg-amber-light' : 'bg-navy-700'}`}
        />
      ))}
    </span>
  )
}

function avgScore(claim: PortfolioClaim): number | null {
  const reviews = claim.reviewRequests.filter(r => r.review)
  if (!reviews.length) return null
  const total = reviews.reduce((sum, r) => {
    const rv = r.review!
    return sum + (rv.scoreDepth + rv.scoreClarity + rv.scoreEvidence + rv.scoreOverall) / 4
  }, 0)
  return Math.round((total / reviews.length) * 10) / 10
}

export default function PortfolioPage() {
  const { username } = useParams<{ username: string }>()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    api
      .getPortfolio(username)
      .then(({ portfolio: p }) => setPortfolio(p))
      .catch(err => {
        if (err instanceof Error && err.message === 'Portfolio not found') {
          setNotFound(true)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load portfolio')
        }
      })
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-700 border-t-amber-light" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-4 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="text-2xl font-semibold text-ivory-100">Portfolio not found</h1>
        <p className="text-sm text-ivory-300/50">
          <span className="font-mono text-amber-light">@{username}</span> hasn't set up a public portfolio yet.
        </p>
        <Link to="/login" className="mt-2 text-sm text-ivory-300/50 hover:text-ivory-100 transition">
          Sign in to Proofstack →
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-navy-950 px-4 text-center">
        <h1 className="text-xl font-semibold text-ivory-100">Something went wrong</h1>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!portfolio) return null

  const displayName = portfolio.displayName || portfolio.name
  const approvedClaims = portfolio.skillClaims.filter(c => c.status === 'APPROVED')
  const otherClaims = portfolio.skillClaims.filter(c => c.status !== 'APPROVED')
  const sortedClaims = [
    ...approvedClaims.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]),
    ...otherClaims.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]),
  ]

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Nav */}
      <header className="border-b border-navy-800 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-ivory-100">
            Proof<span className="text-amber-light">stack</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Hero */}
        <section className="mb-12">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-2xl font-bold text-amber-light">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ivory-100">{displayName}</h1>
              <p className="mt-0.5 text-sm font-mono text-ivory-300/40">@{portfolio.username}</p>
              {portfolio.bio && (
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-ivory-300/70">{portfolio.bio}</p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-8 flex flex-wrap gap-4">
            {[
              { label: 'Projects', value: portfolio.projects.length },
              { label: 'Skill Claims', value: portfolio.skillClaims.length },
              { label: 'Approved Skills', value: approvedClaims.length },
              {
                label: 'Peer Reviews',
                value: portfolio.skillClaims.reduce(
                  (n, c) => n + c.reviewRequests.filter(r => r.review).length,
                  0
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-navy-700 bg-navy-900 px-5 py-3 text-center">
                <p className="text-xl font-bold text-ivory-100">{value}</p>
                <p className="text-xs text-ivory-300/50">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-ivory-100">Projects</h2>
          {portfolio.projects.length === 0 ? (
            <p className="text-sm text-ivory-300/40">No published projects yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {portfolio.projects.map(project => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-navy-700 bg-navy-900 p-5 flex flex-col gap-3"
                >
                  <div>
                    <h3 className="font-semibold text-ivory-100">{project.title}</h3>
                    {project.description && (
                      <p className="mt-1 text-sm text-ivory-300/60 line-clamp-2">{project.description}</p>
                    )}
                  </div>

                  {/* Links */}
                  {(project.repoUrl || project.liveUrl) && (
                    <div className="flex flex-wrap gap-2">
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-700 px-2.5 py-1 text-xs text-ivory-300/60 transition hover:border-navy-500 hover:text-ivory-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Repository
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-navy-700 px-2.5 py-1 text-xs text-ivory-300/60 transition hover:border-navy-500 hover:text-ivory-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Live Demo
                        </a>
                      )}
                    </div>
                  )}

                  {/* Evidence */}
                  {project.evidence.length > 0 && (
                    <div className="border-t border-navy-800 pt-3">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ivory-300/40">Evidence</p>
                      <ul className="space-y-1">
                        {project.evidence.map(ev => (
                          <li key={ev.id} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-light/60" />
                            {ev.url ? (
                              <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-ivory-300/70 hover:text-amber-light transition"
                              >
                                {ev.title}
                              </a>
                            ) : (
                              <span className="text-ivory-300/60">{ev.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skill Claims */}
        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-ivory-100">Skill Claims</h2>
          {sortedClaims.length === 0 ? (
            <p className="text-sm text-ivory-300/40">No skill claims yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sortedClaims.map(claim => {
                const avg = avgScore(claim)
                const completedReviews = claim.reviewRequests.filter(r => r.review)
                return (
                  <div key={claim.id} className="rounded-2xl border border-navy-700 bg-navy-900 p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ivory-100">{claim.skill.name}</p>
                        {claim.skill.category && (
                          <p className="text-xs text-ivory-300/40">{claim.skill.category}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[claim.status] ?? 'bg-navy-800 text-ivory-300/60 border-navy-700'}`}>
                          {claim.status === 'APPROVED' ? '✓ Approved' : claim.status.replace('_', ' ')}
                        </span>
                        <span className="rounded-full bg-navy-800 px-2 py-0.5 text-xs text-ivory-300/50">
                          {LEVEL_LABEL[claim.level]}
                        </span>
                      </div>
                    </div>

                    {claim.summary && (
                      <p className="text-sm text-ivory-300/60">{claim.summary}</p>
                    )}

                    {/* Evidence links */}
                    {claim.evidenceLinks.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ivory-300/40">Supporting Evidence</p>
                        <ul className="space-y-1">
                          {claim.evidenceLinks.map(({ evidence: ev }) => (
                            <li key={ev.id} className="flex items-start gap-2 text-sm">
                              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-light/60" />
                              {ev.url ? (
                                <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-ivory-300/70 hover:text-amber-light transition">
                                  {ev.title}
                                </a>
                              ) : (
                                <span className="text-ivory-300/60">{ev.title}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Peer review summary */}
                    {completedReviews.length > 0 && (
                      <div className="border-t border-navy-800 pt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-ivory-300/40">
                            Peer Reviews ({completedReviews.length})
                          </p>
                          {avg !== null && (
                            <div className="flex items-center gap-1.5">
                              <ScoreDots value={Math.round(avg)} />
                              <span className="text-xs text-ivory-300/50">{avg}/5</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {completedReviews.map(rr => {
                            if (!rr.review) return null
                            const rv = rr.review
                            const reviewer = rv.reviewRequest.reviewer
                            const reviewerName = reviewer.displayName || reviewer.name
                            return (
                              <div key={rr.id} className="rounded-xl bg-navy-800/60 p-3">
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-ivory-300/70">{reviewerName}</p>
                                  <div className="flex items-center gap-1">
                                    <ScoreDots value={rv.scoreOverall} />
                                  </div>
                                </div>
                                <p className="text-xs leading-relaxed text-ivory-300/50 line-clamp-3">{rv.feedback}</p>
                                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                  {[
                                    { label: 'Depth', v: rv.scoreDepth },
                                    { label: 'Clarity', v: rv.scoreClarity },
                                    { label: 'Evidence', v: rv.scoreEvidence },
                                  ].map(({ label, v }) => (
                                    <span key={label} className="text-xs text-ivory-300/40">
                                      {label}: <span className="text-ivory-300/60">{v}/5</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-navy-800 pt-8 text-center">
          <p className="text-xs text-ivory-300/30">
            Built with{' '}
            <Link to="/" className="text-amber-light/60 hover:text-amber-light transition">
              Proofstack
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}
