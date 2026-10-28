import { useState, useEffect, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ReviewRequest, ReviewRequestStatus } from '../types/review'
import type { SkillClaim } from '../types/skill'
import type { ReviewUser } from '../types/review'

// ── constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReviewRequestStatus, string> = {
  PENDING:     'Pending',
  ACCEPTED:    'Accepted',
  DECLINED:    'Declined',
  COMPLETED:   'Completed',
}
const STATUS_STYLE: Record<ReviewRequestStatus, string> = {
  PENDING:   'bg-amber-900/40 text-amber-300',
  ACCEPTED:  'bg-blue-900/40 text-blue-300',
  DECLINED:  'bg-red-900/40 text-red-300',
  COMPLETED: 'bg-emerald-900/40 text-emerald-300',
}

const SCORE_LABELS = ['scoreDepth', 'scoreClarity', 'scoreEvidence', 'scoreOverall'] as const
type ScoreKey = typeof SCORE_LABELS[number]
const SCORE_DISPLAY: Record<ScoreKey, string> = {
  scoreDepth:    'Depth',
  scoreClarity:  'Clarity',
  scoreEvidence: 'Evidence',
  scoreOverall:  'Overall',
}

// ── score input ───────────────────────────────────────────────────────────────

function ScoreInput({ label, value, onChange, disabled }: {
  label: string; value: number; onChange: (v: number) => void; disabled: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ivory-300/60">
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light ${
              value === n
                ? 'bg-amber-accent text-white shadow-sm'
                : 'border border-navy-600 bg-navy-900/60 text-ivory-300/60 hover:border-amber-light/60 hover:bg-navy-800 hover:text-amber-light'
            } disabled:opacity-50`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── review form ───────────────────────────────────────────────────────────────

function ReviewForm({ requestId, onDone }: { requestId: string; onDone: (r: ReviewRequest) => void }) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    scoreDepth: 3, scoreClarity: 3, scoreEvidence: 3, scoreOverall: 3,
  })
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!feedback.trim()) { setError('Feedback is required'); return }
    setError('')
    setSubmitting(true)
    try {
      const { request } = await api.submitReview(requestId, { feedback, ...scores })
      onDone(request)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5 rounded-xl border border-navy-700 bg-navy-800/50 p-4 sm:p-5">
      <div><p className="text-sm font-semibold text-ivory-100">Submit your review</p><p className="mt-1 text-xs text-ivory-300/45">Rate each area from 1 to 5, then leave constructive feedback.</p></div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SCORE_LABELS.map(key => (
          <ScoreInput
            key={key}
            label={SCORE_DISPLAY[key]}
            value={scores[key]}
            onChange={v => setScores(s => ({ ...s, [key]: v }))}
            disabled={submitting}
          />
        ))}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/50">
          Feedback <span className="text-red-400">*</span>
        </label>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          disabled={submitting}
          rows={4}
          placeholder="Provide constructive feedback on the skill claim and supporting evidence…"
          className="w-full resize-y rounded-lg border border-navy-600 bg-navy-900/70 px-4 py-3 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-2 focus:ring-amber-light/20 disabled:opacity-50"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-amber-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}

// ── request card ──────────────────────────────────────────────────────────────

function RequestCard({
  req,
  currentUserId,
  onUpdate,
}: {
  req: ReviewRequest
  currentUserId: string
  onUpdate: (r: ReviewRequest) => void
}) {
  const isReviewer = req.reviewer.id === currentUserId
  const isRequester = req.requester.id === currentUserId
  const [responding, setResponding] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [error, setError] = useState('')

  async function respond(status: 'ACCEPTED' | 'DECLINED') {
    setResponding(true)
    setError('')
    try {
      const { request } = await api.respondToRequest(req.id, status)
      onUpdate(request)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-700/90 bg-navy-900/90 shadow-lg shadow-black/10 transition-colors hover:border-navy-600">
      <div className="px-4 py-5 sm:px-6">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ivory-100">
                {req.claim.skill.name}
              </span>
              <span className="rounded-full border border-navy-600 bg-navy-800 px-2.5 py-1 text-xs font-medium text-ivory-300/70">
                {req.claim.level.charAt(0) + req.claim.level.slice(1).toLowerCase()}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[req.status]}`}>
                {STATUS_LABEL[req.status]}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-ivory-300/40">
              <span>From: <span className="text-ivory-300/60">{req.requester.name}</span></span>
              <span>To: <span className="text-ivory-300/60">{req.reviewer.name}</span></span>
            </div>
            {req.message && (
              <p className="mt-2 text-sm text-ivory-300/60 italic">"{req.message}"</p>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        {/* Reviewer actions — PENDING */}
        {isReviewer && req.status === 'PENDING' && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-navy-700/70 pt-4">
            <span className="text-xs text-ivory-300/40">Respond to this request:</span>
            <button
              onClick={() => respond('ACCEPTED')}
              disabled={responding}
              className="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-800/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respond('DECLINED')}
              disabled={responding}
              className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        )}

        {/* Reviewer actions — ACCEPTED, no review yet */}
        {isReviewer && req.status === 'ACCEPTED' && !req.review && !showReviewForm && (
          <div className="mt-4">
            <button
              onClick={() => setShowReviewForm(true)}
              className="rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
            >
              Write review
            </button>
          </div>
        )}

        {isReviewer && req.status === 'ACCEPTED' && !req.review && showReviewForm && (
          <ReviewForm requestId={req.id} onDone={updated => { onUpdate(updated); setShowReviewForm(false) }} />
        )}

        {/* Completed review */}
        {req.review && (
          <div className="mt-4 rounded-xl border border-navy-700/60 bg-navy-800/40 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ivory-300/40">
              Review {isRequester ? 'received' : 'submitted'}
            </p>
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SCORE_LABELS.map(key => (
                <div key={key} className="text-center">
                  <p className="text-xs text-ivory-300/40">{SCORE_DISPLAY[key]}</p>
                  <p className="text-xl font-bold text-amber-light">{req.review![key]}</p>
                  <p className="text-xs text-ivory-300/30">/ 5</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-ivory-300/70">{req.review.feedback}</p>
          </div>
        )}

        {/* Declined notice */}
        {req.status === 'DECLINED' && (
          <p className="mt-3 text-xs text-red-400/70">
            {isRequester ? 'The reviewer declined this request.' : 'You declined this request.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── request form ──────────────────────────────────────────────────────────────

function RequestForm({
  claims,
  users,
  onCreated,
  onCancel,
}: {
  claims: SkillClaim[]
  users: ReviewUser[]
  onCreated: (r: ReviewRequest) => void
  onCancel: () => void
}) {
  const [claimId, setClaimId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!claimId) { setError('Please select a skill claim'); return }
    if (!reviewerId) { setError('Please select a reviewer'); return }
    setError('')
    setSubmitting(true)
    try {
      const { request } = await api.createReviewRequest(claimId, reviewerId, message)
      onCreated(request)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  const selectCls = 'w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Skill claim <span className="text-red-400">*</span>
          </label>
          <select value={claimId} onChange={e => setClaimId(e.target.value)} disabled={submitting} className={selectCls}>
            <option value="">Select a claim…</option>
            {claims.map(c => (
              <option key={c.id} value={c.id}>
                {c.skill.name} — {c.level.charAt(0) + c.level.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {claims.length === 0 && (
            <p className="mt-1 text-xs text-ivory-300/30">Create a skill claim first.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Reviewer <span className="text-red-400">*</span>
          </label>
          <select value={reviewerId} onChange={e => setReviewerId(e.target.value)} disabled={submitting} className={selectCls}>
            <option value="">Select a reviewer…</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          {users.length === 0 && (
            <p className="mt-1 text-xs text-ivory-300/30">No other users registered yet.</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Message to reviewer
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={submitting}
          rows={2}
          placeholder="Optional context for the reviewer…"
          className="w-full resize-y rounded-lg border border-navy-600 bg-navy-900/70 px-4 py-3 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-2 focus:ring-amber-light/20 disabled:opacity-50"
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} disabled={submitting}
          className="rounded-lg border border-navy-600 px-4 py-2 text-sm text-ivory-300 transition hover:border-navy-400 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-amber-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Sending…' : 'Send request'}
        </button>
      </div>
    </form>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [claims, setClaims] = useState<SkillClaim[]>([])
  const [users, setUsers] = useState<ReviewUser[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    Promise.all([api.getReviews(), api.getClaims(), api.getUsers()])
      .then(([{ requests: r }, { claims: c }, { users: u }]) => {
        setRequests(r)
        setClaims(c)
        setUsers(u)
      })
      .catch(e => setFetchError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  function updateRequest(updated: ReviewRequest) {
    setRequests(prev => prev.map(r => r.id === updated.id ? updated : r))
  }

  const outgoing = requests.filter(r => r.requester.id === user?.id)
  const incoming = requests.filter(r => r.reviewer.id === user?.id)

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-light"><span className="h-1.5 w-1.5 rounded-full bg-amber-light" />Skill verification</div>
          <h1 className="text-3xl font-semibold tracking-tight text-ivory-100">Peer Reviews</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ivory-300/55">
            Request and give reviews on skill claims.
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            className="rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
          >
            + Request review
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-8 rounded-2xl border border-navy-700 bg-navy-900/90 p-4 shadow-xl sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-ivory-100">New review request</h2>
          <p className="mb-5 text-sm text-ivory-300/50">Choose one of your claims and a registered peer to review it.</p>
          {createError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{createError}</div>
          )}
          <RequestForm
            claims={claims}
            users={users}
            onCreated={r => { setRequests(prev => [r, ...prev]); setShowCreate(false) }}
            onCancel={() => { setShowCreate(false); setCreateError('') }}
          />
        </div>
      )}

      {loading && <div className="flex items-center justify-center gap-3 rounded-2xl border border-navy-700 bg-navy-900/50 py-16 text-sm text-ivory-300/50"><span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-600 border-t-amber-light" />Loading review requests…</div>}

      {!loading && fetchError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{fetchError}</div>
      )}

      {!loading && !fetchError && requests.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-700 bg-navy-900/30 px-5 py-16 text-center sm:py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-ivory-300/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ivory-300/60">No review requests yet</p>
          <p className="mt-1 text-sm text-ivory-300/30">Request a peer review of one of your skill claims.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 rounded-lg bg-amber-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light"
          >
            Request a review
          </button>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-8">
          {incoming.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300/55">
                Incoming — reviews to give ({incoming.length})
              </h2>
              <div className="space-y-5">
                {incoming.map(r => (
                  <RequestCard key={r.id} req={r} currentUserId={user!.id} onUpdate={updateRequest} />
                ))}
              </div>
            </section>
          )}

          {outgoing.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300/55">
                Outgoing — reviews requested ({outgoing.length})
              </h2>
              <div className="space-y-5">
                {outgoing.map(r => (
                  <RequestCard key={r.id} req={r} currentUserId={user!.id} onUpdate={updateRequest} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
