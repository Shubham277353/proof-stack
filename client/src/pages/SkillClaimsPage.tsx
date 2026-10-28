import { useState, useEffect, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import { api } from '../lib/api'
import type { Skill, SkillClaim, ClaimLevel, ClaimStatus } from '../types/skill'
import type { Evidence } from '../types/evidence'
import type { Project } from '../types/project'

// ── constants ─────────────────────────────────────────────────────────────────

const LEVELS: ClaimLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const LEVEL_LABELS: Record<ClaimLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  EXPERT: 'Expert',
}
const LEVEL_STYLES: Record<ClaimLevel, string> = {
  BEGINNER:     'bg-slate-700/60 text-slate-300',
  INTERMEDIATE: 'bg-blue-900/60 text-blue-300',
  ADVANCED:     'bg-violet-900/60 text-violet-300',
  EXPERT:       'bg-amber-900/60 text-amber-300',
}
const STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT:        'Draft',
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED:     'Approved',
  REJECTED:     'Rejected',
}
const STATUS_STYLES: Record<ClaimStatus, string> = {
  DRAFT:        'text-ivory-300/40',
  SUBMITTED:    'text-blue-400',
  UNDER_REVIEW: 'text-amber-400',
  APPROVED:     'text-emerald-400',
  REJECTED:     'text-red-400',
}

// ── evidence picker ───────────────────────────────────────────────────────────

interface EvidenceItem { id: string; title: string; url: string | null; projectTitle: string }

interface EvidencePickerProps {
  allEvidence: EvidenceItem[]
  selected: string[]
  onChange: (ids: string[]) => void
  disabled: boolean
}

function EvidencePicker({ allEvidence, selected, onChange, disabled }: EvidencePickerProps) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  if (allEvidence.length === 0) {
    return <p className="text-xs text-ivory-300/30 italic">No evidence yet — add some to your projects first.</p>
  }
  return (
    <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-navy-700 bg-navy-800/50 p-2">
      {allEvidence.map(ev => {
        const checked = selected.includes(ev.id)
        return (
          <label
            key={ev.id}
            className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 transition ${
              checked ? 'bg-navy-700' : 'hover:bg-navy-800'
            } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(ev.id)}
              disabled={disabled}
              className="mt-0.5 accent-amber-400"
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ivory-100">{ev.title}</p>
              <p className="text-xs text-ivory-300/40">{ev.projectTitle}</p>
            </div>
          </label>
        )
      })}
    </div>
  )
}

// ── claim form ────────────────────────────────────────────────────────────────

interface FormProps {
  skills: Skill[]
  allEvidence: EvidenceItem[]
  initial: { skillId: string; level: ClaimLevel; summary: string; evidenceIds: string[] }
  lockSkill: boolean
  submitLabel: string
  submitting: boolean
  error: string
  onSubmit: (data: { skillId: string; level: ClaimLevel; summary: string; evidenceIds: string[] }) => void
  onCancel: () => void
}

function ClaimForm({ skills, allEvidence, initial, lockSkill, submitLabel, submitting, error, onSubmit, onCancel }: FormProps) {
  const [skillId, setSkillId] = useState(initial.skillId)
  const [level, setLevel] = useState<ClaimLevel>(initial.level)
  const [summary, setSummary] = useState(initial.summary)
  const [evidenceIds, setEvidenceIds] = useState<string[]>(initial.evidenceIds)
  const [fieldError, setFieldError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!skillId) { setFieldError('Please select a skill'); return }
    setFieldError('')
    onSubmit({ skillId, level, summary, evidenceIds })
  }

  const inputCls = 'w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50'

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {(error || fieldError) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error || fieldError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Skill <span className="text-red-400">*</span>
          </label>
          <select
            value={skillId}
            onChange={e => setSkillId(e.target.value)}
            disabled={submitting || lockSkill}
            className={inputCls}
          >
            <option value="">Select a skill…</option>
            {skills.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Level <span className="text-red-400">*</span>
          </label>
          <select
            value={level}
            onChange={e => setLevel(e.target.value as ClaimLevel)}
            disabled={submitting}
            className={inputCls}
          >
            {LEVELS.map(l => (
              <option key={l} value={l}>{LEVEL_LABELS[l]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Summary
        </label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          disabled={submitting}
          rows={2}
          placeholder="Briefly describe your experience with this skill…"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Supporting evidence
        </label>
        <EvidencePicker
          allEvidence={allEvidence}
          selected={evidenceIds}
          onChange={setEvidenceIds}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-navy-600 px-4 py-2 text-sm text-ivory-300 transition hover:border-navy-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-amber-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function SkillClaimsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [claims, setClaims] = useState<SkillClaim[]>([])
  const [allEvidence, setAllEvidence] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.getSkills(),
      api.getClaims(),
      api.getProjects(),
    ])
      .then(async ([{ skills: s }, { claims: c }, { projects: p }]) => {
        setSkills(s)
        setClaims(c)
        // Fetch evidence for all projects, flatten with project title
        const evidenceLists = await Promise.all(
          p.map((proj: Project) =>
            api.getEvidence(proj.id).then(({ evidence }) =>
              evidence.map((ev: Evidence) => ({ ...ev, projectTitle: proj.title }))
            )
          )
        )
        setAllEvidence(evidenceLists.flat())
      })
      .catch(e => setFetchError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data: { skillId: string; level: ClaimLevel; summary: string; evidenceIds: string[] }) {
    setCreating(true)
    setCreateError('')
    try {
      const { claim } = await api.createClaim(data)
      setClaims(prev => [claim, ...prev])
      setShowCreate(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create claim')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, data: { skillId: string; level: ClaimLevel; summary: string; evidenceIds: string[] }) {
    setUpdating(true)
    setUpdateError('')
    try {
      const { claim } = await api.updateClaim(id, data)
      setClaims(prev => prev.map(x => x.id === id ? claim : x))
      setEditingId(null)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Failed to update claim')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.deleteClaim(id)
      setClaims(prev => prev.filter(x => x.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete claim')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  return (
    <AppShell>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ivory-100">Skill Claims</h1>
          <p className="mt-0.5 text-sm text-ivory-300/50">
            Declare your skills and back them with evidence.
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            className="rounded-lg bg-amber-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-light"
          >
            + New claim
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-8 rounded-2xl border border-navy-700 bg-navy-900 px-6 py-6 shadow-xl">
          <h2 className="mb-5 text-base font-semibold text-ivory-100">New skill claim</h2>
          <ClaimForm
            skills={skills}
            allEvidence={allEvidence}
            initial={{ skillId: '', level: 'BEGINNER', summary: '', evidenceIds: [] }}
            lockSkill={false}
            submitLabel="Create claim"
            submitting={creating}
            error={createError}
            onSubmit={handleCreate}
            onCancel={() => { setShowCreate(false); setCreateError('') }}
          />
        </div>
      )}

      {loading && (
        <div className="py-20 text-center text-sm text-ivory-300/40">Loading…</div>
      )}

      {!loading && fetchError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && claims.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-700 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-ivory-300/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ivory-300/60">No skill claims yet</p>
          <p className="mt-1 text-sm text-ivory-300/30">Claim a skill and attach evidence to back it up.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 rounded-lg bg-amber-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-light"
          >
            Make your first claim
          </button>
        </div>
      )}

      {/* Claims list */}
      {!loading && claims.length > 0 && (
        <ul className="space-y-4">
          {claims.map(claim => (
            <li key={claim.id} className="rounded-2xl border border-navy-700 bg-navy-900 shadow-md">
              {editingId === claim.id ? (
                <div className="px-6 py-6">
                  <h2 className="mb-5 text-base font-semibold text-ivory-100">Edit claim</h2>
                  <ClaimForm
                    skills={skills}
                    allEvidence={allEvidence}
                    initial={{
                      skillId: claim.skill.id,
                      level: claim.level,
                      summary: claim.summary ?? '',
                      evidenceIds: claim.evidenceLinks.map(l => l.evidence.id),
                    }}
                    lockSkill={true}
                    submitLabel="Save changes"
                    submitting={updating}
                    error={updateError}
                    onSubmit={data => handleUpdate(claim.id, data)}
                    onCancel={() => { setEditingId(null); setUpdateError('') }}
                  />
                </div>
              ) : (
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Skill + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-ivory-100">
                          {claim.skill.name}
                        </h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLES[claim.level]}`}>
                          {LEVEL_LABELS[claim.level]}
                        </span>
                        <span className={`text-xs font-medium ${STATUS_STYLES[claim.status]}`}>
                          {STATUS_LABELS[claim.status]}
                        </span>
                      </div>

                      {/* Category */}
                      {claim.skill.category && (
                        <p className="mt-0.5 text-xs text-ivory-300/40">{claim.skill.category}</p>
                      )}

                      {/* Summary */}
                      {claim.summary && (
                        <p className="mt-2 text-sm text-ivory-300/60">{claim.summary}</p>
                      )}

                      {/* Evidence links */}
                      {claim.evidenceLinks.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {claim.evidenceLinks.map(({ evidence: ev }) => (
                            ev.url ? (
                              <a
                                key={ev.id}
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-md border border-navy-700 bg-navy-800/50 px-2.5 py-1 text-xs text-ivory-300/60 transition hover:border-navy-500 hover:text-amber-light"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {ev.title}
                              </a>
                            ) : (
                              <span
                                key={ev.id}
                                className="rounded-md border border-navy-700 bg-navy-800/50 px-2.5 py-1 text-xs text-ivory-300/40"
                              >
                                {ev.title}
                              </span>
                            )
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {deleteConfirmId === claim.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ivory-300/50">Delete?</span>
                          <button
                            onClick={() => handleDelete(claim.id)}
                            disabled={deletingId === claim.id}
                            className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            {deletingId === claim.id ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-md border border-navy-600 px-3 py-1.5 text-xs text-ivory-300 transition hover:border-navy-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(claim.id); setUpdateError('') }}
                            className="rounded-md border border-navy-600 px-3 py-1.5 text-xs text-ivory-300 transition hover:border-navy-400 hover:text-ivory-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(claim.id)}
                            className="rounded-md border border-navy-700 px-3 py-1.5 text-xs text-ivory-300/40 transition hover:border-red-500/50 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
