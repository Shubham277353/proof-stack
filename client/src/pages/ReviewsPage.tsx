import { useState, useEffect, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import type { ReviewRequest, ReviewRequestStatus, ReviewAttachment } from '../types/review'
import type { SkillClaim } from '../types/skill'
import type { ReviewUser } from '../types/review'
import type { Project } from '../types/project'

// ── constants ─────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReviewRequestStatus, string> = {
  PENDING:   'Pending',
  ACCEPTED:  'Accepted',
  DECLINED:  'Declined',
  COMPLETED: 'Completed',
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

const selectCls = 'w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50'

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
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {SCORE_LABELS.map(key => (
          <ScoreInput key={key} label={SCORE_DISPLAY[key]} value={scores[key]} onChange={v => setScores(s => ({ ...s, [key]: v }))} disabled={submitting} />
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
        <button type="submit" disabled={submitting}
          className="rounded-lg bg-amber-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}

// ── attachments panel ─────────────────────────────────────────────────────────

function AttachmentsPanel({ attachments }: { attachments: ReviewAttachment[] }) {
  if (attachments.length === 0) return null
  return (
    <div className="mt-4 rounded-xl border border-navy-700/60 bg-navy-800/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ivory-300/40">Attachments</p>
      <ul className="space-y-2">
        {attachments.map(a => {
          if (a.project) {
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-navy-700 px-1.5 py-0.5 text-xs text-ivory-300/50">Project</span>
                <span className="font-medium text-ivory-100">{a.project.title}</span>
                {a.label && <span className="text-ivory-300/40">— {a.label}</span>}
                <span className="flex gap-2 text-xs">
                  {a.project.repoUrl && (
                    <a href={a.project.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-amber-light/80 underline-offset-2 hover:underline">Repo</a>
                  )}
                  {a.project.liveUrl && (
                    <a href={a.project.liveUrl} target="_blank" rel="noopener noreferrer"
                      className="text-amber-light/80 underline-offset-2 hover:underline">Live</a>
                  )}
                </span>
              </li>
            )
          }
          if (a.evidence) {
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-navy-700 px-1.5 py-0.5 text-xs text-ivory-300/50">Evidence</span>
                {a.evidence.url ? (
                  <a href={a.evidence.url} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-amber-light/90 underline-offset-2 hover:underline">{a.evidence.title}</a>
                ) : (
                  <span className="font-medium text-ivory-100">{a.evidence.title}</span>
                )}
                {a.label && <span className="text-ivory-300/40">— {a.label}</span>}
              </li>
            )
          }
          if (a.externalUrl) {
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded bg-navy-700 px-1.5 py-0.5 text-xs text-ivory-300/50">Link</span>
                <a href={a.externalUrl} target="_blank" rel="noopener noreferrer"
                  className="font-medium text-amber-light/90 underline-offset-2 hover:underline">
                  {a.label || a.externalUrl}
                </a>
                {a.label && <span className="text-ivory-300/40 text-xs">{a.externalUrl}</span>}
              </li>
            )
          }
          return null
        })}
      </ul>
    </div>
  )
}

// ── request card ──────────────────────────────────────────────────────────────

function RequestCard({ req, currentUserId, onUpdate }: {
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-ivory-100">{req.claim.skill.name}</span>
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

        <AttachmentsPanel attachments={req.attachments} />

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
        )}

        {isReviewer && req.status === 'PENDING' && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-navy-700/70 pt-4">
            <span className="text-xs text-ivory-300/40">Respond to this request:</span>
            <button onClick={() => respond('ACCEPTED')} disabled={responding}
              className="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-800/50 disabled:cursor-not-allowed disabled:opacity-50">
              Accept
            </button>
            <button onClick={() => respond('DECLINED')} disabled={responding}
              className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50">
              Decline
            </button>
          </div>
        )}

        {isReviewer && req.status === 'ACCEPTED' && !req.review && !showReviewForm && (
          <div className="mt-4">
            <button onClick={() => setShowReviewForm(true)}
              className="rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">
              Write review
            </button>
          </div>
        )}

        {isReviewer && req.status === 'ACCEPTED' && !req.review && showReviewForm && (
          <ReviewForm requestId={req.id} onDone={updated => { onUpdate(updated); setShowReviewForm(false) }} />
        )}

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

        {req.status === 'DECLINED' && (
          <p className="mt-3 text-xs text-red-400/70">
            {isRequester ? 'The reviewer declined this request.' : 'You declined this request.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── attachment types ──────────────────────────────────────────────────────────

type AttachmentDraft =
  | { type: 'project'; projectId: string; label: string }
  | { type: 'evidence'; evidenceId: string; label: string }
  | { type: 'url'; externalUrl: string; label: string }

// ── request form ──────────────────────────────────────────────────────────────

function RequestForm({ claims, users, projects, onCreated, onCancel }: {
  claims: SkillClaim[]
  users: ReviewUser[]
  projects: Project[]
  onCreated: (r: ReviewRequest) => void
  onCancel: () => void
}) {
  const [claimId, setClaimId] = useState('')
  const [reviewerId, setReviewerId] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [urlLabel, setUrlLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Evidence linked to the selected claim
  const selectedClaim = claims.find(c => c.id === claimId)
  const claimEvidence = selectedClaim?.evidenceLinks ?? []

  const attachedProjectIds = new Set(attachments.filter(a => a.type === 'project').map(a => (a as { type: 'project'; projectId: string }).projectId))
  const attachedEvidenceIds = new Set(attachments.filter(a => a.type === 'evidence').map(a => (a as { type: 'evidence'; evidenceId: string }).evidenceId))
  const attachedUrls = new Set(attachments.filter(a => a.type === 'url').map(a => (a as { type: 'url'; externalUrl: string }).externalUrl))

  function toggleProject(projectId: string, title: string) {
    if (attachedProjectIds.has(projectId)) {
      setAttachments(prev => prev.filter(a => !(a.type === 'project' && a.projectId === projectId)))
    } else {
      setAttachments(prev => [...prev, { type: 'project', projectId, label: title }])
    }
  }

  function toggleEvidence(evidenceId: string, title: string) {
    if (attachedEvidenceIds.has(evidenceId)) {
      setAttachments(prev => prev.filter(a => !(a.type === 'evidence' && a.evidenceId === evidenceId)))
    } else {
      setAttachments(prev => [...prev, { type: 'evidence', evidenceId, label: title }])
    }
  }

  function addUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    try { const u = new URL(trimmed); if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error() } catch { setError('URL must start with http:// or https://'); return }
    if (attachedUrls.has(trimmed)) { setError('That URL is already attached'); return }
    setAttachments(prev => [...prev, { type: 'url', externalUrl: trimmed, label: urlLabel.trim() }])
    setUrlInput('')
    setUrlLabel('')
    setError('')
  }

  function removeAttachment(idx: number) {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!claimId) { setError('Please select a skill claim'); return }
    if (!reviewerId) { setError('Please select a reviewer'); return }
    if (attachments.length === 0) { setError('Add at least one attachment so the reviewer can inspect your work'); return }
    setError('')
    setSubmitting(true)
    try {
      const { request } = await api.createReviewRequest(claimId, reviewerId, message, attachments)
      onCreated(request)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Skill claim <span className="text-red-400">*</span>
          </label>
          <select value={claimId} onChange={e => { setClaimId(e.target.value); setAttachments([]) }} disabled={submitting} className={selectCls}>
            <option value="">Select a claim…</option>
            {claims.map(c => (
              <option key={c.id} value={c.id}>{c.skill.name} — {c.level.charAt(0) + c.level.slice(1).toLowerCase()}</option>
            ))}
          </select>
          {claims.length === 0 && <p className="mt-1 text-xs text-ivory-300/30">Create a skill claim first.</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Reviewer <span className="text-red-400">*</span>
          </label>
          <select value={reviewerId} onChange={e => setReviewerId(e.target.value)} disabled={submitting} className={selectCls}>
            <option value="">Select a reviewer…</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          {users.length === 0 && <p className="mt-1 text-xs text-ivory-300/30">No other users registered yet.</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">Message to reviewer</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} disabled={submitting} rows={2}
          placeholder="Optional context for the reviewer…"
          className="w-full resize-y rounded-lg border border-navy-600 bg-navy-900/70 px-4 py-3 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-2 focus:ring-amber-light/20 disabled:opacity-50" />
      </div>

      {/* Attachments section */}
      <div className="rounded-xl border border-navy-700 bg-navy-800/30 p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ivory-300/60">
            Attachments <span className="text-red-400">*</span>
          </p>
          <p className="mt-0.5 text-xs text-ivory-300/35">Select projects and evidence, or add GitHub / live demo URLs.</p>
        </div>

        {/* Projects */}
        {projects.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-ivory-300/50">Your projects</p>
            <div className="flex flex-wrap gap-2">
              {projects.map(p => {
                const checked = attachedProjectIds.has(p.id)
                return (
                  <button key={p.id} type="button" disabled={submitting} onClick={() => toggleProject(p.id, p.title)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${checked ? 'border-amber-light/60 bg-amber-900/30 text-amber-200' : 'border-navy-600 bg-navy-800 text-ivory-300/60 hover:border-navy-400 hover:text-ivory-100'} disabled:opacity-50`}>
                    {checked ? '✓ ' : ''}{p.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Evidence linked to selected claim */}
        {claimEvidence.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-ivory-300/50">Evidence for this claim</p>
            <div className="flex flex-wrap gap-2">
              {claimEvidence.map(({ evidence: ev }) => {
                const checked = attachedEvidenceIds.has(ev.id)
                return (
                  <button key={ev.id} type="button" disabled={submitting} onClick={() => toggleEvidence(ev.id, ev.title)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${checked ? 'border-amber-light/60 bg-amber-900/30 text-amber-200' : 'border-navy-600 bg-navy-800 text-ivory-300/60 hover:border-navy-400 hover:text-ivory-100'} disabled:opacity-50`}>
                    {checked ? '✓ ' : ''}{ev.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* External URL */}
        <div>
          <p className="mb-2 text-xs font-medium text-ivory-300/50">Add a link (GitHub repo, live demo, etc.)</p>
          <div className="flex flex-wrap gap-2">
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)} disabled={submitting}
              placeholder="https://github.com/…"
              className="flex-1 min-w-48 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light/40 disabled:opacity-50" />
            <input value={urlLabel} onChange={e => setUrlLabel(e.target.value)} disabled={submitting}
              placeholder="Label (optional)"
              className="w-36 rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light/40 disabled:opacity-50" />
            <button type="button" onClick={addUrl} disabled={submitting || !urlInput.trim()}
              className="rounded-lg border border-navy-600 px-3 py-2 text-sm text-ivory-300 transition hover:border-navy-400 disabled:opacity-40">
              Add
            </button>
          </div>
        </div>

        {/* Attachment summary */}
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-navy-700 bg-navy-800/60 px-3 py-2 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 rounded bg-navy-700 px-1.5 py-0.5 text-ivory-300/50">
                    {a.type === 'project' ? 'Project' : a.type === 'evidence' ? 'Evidence' : 'Link'}
                  </span>
                  <span className="truncate text-ivory-200">
                    {a.type === 'project' ? a.label || a.projectId
                      : a.type === 'evidence' ? a.label || a.evidenceId
                      : a.label ? `${a.label} — ${a.externalUrl}` : a.externalUrl}
                  </span>
                </span>
                <button type="button" onClick={() => removeAttachment(i)} disabled={submitting}
                  className="shrink-0 text-ivory-300/30 hover:text-red-400 disabled:opacity-40">✕</button>
              </li>
            ))}
          </ul>
        )}
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
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    Promise.all([api.getReviews(), api.getClaims(), api.getUsers(), api.getProjects()])
      .then(([{ requests: r }, { claims: c }, { users: u }, { projects: p }]) => {
        setRequests(r)
        setClaims(c)
        setUsers(u)
        setProjects(p)
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
          <p className="mt-2 max-w-xl text-sm leading-6 text-ivory-300/55">Request and give reviews on skill claims.</p>
        </div>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)}
            className="rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900">
            + Request review
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-8 rounded-2xl border border-navy-700 bg-navy-900/90 p-4 shadow-xl sm:p-6">
          <h2 className="mb-1 text-lg font-semibold text-ivory-100">New review request</h2>
          <p className="mb-5 text-sm text-ivory-300/50">Choose one of your claims and a registered peer to review it.</p>
          <RequestForm
            claims={claims}
            users={users}
            projects={projects}
            onCreated={r => { setRequests(prev => [r, ...prev]); setShowCreate(false) }}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-navy-700 bg-navy-900/50 py-16 text-sm text-ivory-300/50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-navy-600 border-t-amber-light" />
          Loading review requests…
        </div>
      )}

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
          <button onClick={() => setShowCreate(true)}
            className="mt-6 rounded-lg bg-amber-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light">
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
                {incoming.map(r => <RequestCard key={r.id} req={r} currentUserId={user!.id} onUpdate={updateRequest} />)}
              </div>
            </section>
          )}
          {outgoing.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory-300/55">
                Outgoing — reviews requested ({outgoing.length})
              </h2>
              <div className="space-y-5">
                {outgoing.map(r => <RequestCard key={r.id} req={r} currentUserId={user!.id} onUpdate={updateRequest} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  )
}
