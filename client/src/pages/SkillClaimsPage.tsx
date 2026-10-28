import { useState, useEffect, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import { InlineSpinner, ErrorBanner, EmptyState, Badge, PrimaryBtn, GhostBtn, DangerBtn, inputCls } from '../components/ui'
import type { BadgeVariant } from '../components/ui'
import { api } from '../lib/api'
import type { Skill, SkillClaim, ClaimLevel, ClaimStatus } from '../types/skill'
import type { Evidence } from '../types/evidence'
import type { Project } from '../types/project'

const LEVELS: ClaimLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const LEVEL_LABELS: Record<ClaimLevel, string> = {
  BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced', EXPERT: 'Expert',
}
const LEVEL_VARIANTS: Record<ClaimLevel, BadgeVariant> = {
  BEGINNER: 'beginner', INTERMEDIATE: 'intermediate', ADVANCED: 'advanced', EXPERT: 'expert',
}
const STATUS_LABELS: Record<ClaimStatus, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved', REJECTED: 'Rejected',
}
const STATUS_VARIANTS: Record<ClaimStatus, BadgeVariant> = {
  DRAFT: 'draft', SUBMITTED: 'submitted', UNDER_REVIEW: 'under_review', APPROVED: 'approved', REJECTED: 'rejected',
}

interface EvidenceItem { id: string; title: string; url: string | null; projectTitle: string }

function EvidencePicker({ allEvidence, selected, onChange, disabled }: {
  allEvidence: EvidenceItem[]; selected: string[]; onChange: (ids: string[]) => void; disabled: boolean
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id])
  }
  if (allEvidence.length === 0) {
    return <p className="text-xs text-ivory-300/35 italic">No evidence yet — add some to your projects first.</p>
  }
  return (
    <div className="max-h-48 overflow-y-auto space-y-0.5 rounded-lg border border-navy-700 bg-navy-800/50 p-1.5">
      {allEvidence.map(ev => {
        const checked = selected.includes(ev.id)
        return (
          <label
            key={ev.id}
            className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2.5 py-2 transition ${
              checked ? 'bg-navy-700' : 'hover:bg-navy-800'
            } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input
              type="checkbox" checked={checked} onChange={() => toggle(ev.id)}
              disabled={disabled} className="mt-0.5 accent-amber-400"
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {(error || fieldError) && <ErrorBanner message={error || fieldError} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/55">
            Skill <span className="text-red-400">*</span>
          </label>
          <select value={skillId} onChange={e => setSkillId(e.target.value)}
            disabled={submitting || lockSkill} className={inputCls()}>
            <option value="">Select a skill…</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/55">
            Level <span className="text-red-400">*</span>
          </label>
          <select value={level} onChange={e => setLevel(e.target.value as ClaimLevel)}
            disabled={submitting} className={inputCls()}>
            {LEVELS.map(l => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/55">Summary</label>
        <textarea value={summary} onChange={e => setSummary(e.target.value)}
          disabled={submitting} rows={2} placeholder="Briefly describe your experience with this skill…"
          className={`${inputCls()} resize-none`} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/55">
          Supporting evidence
        </label>
        <EvidencePicker allEvidence={allEvidence} selected={evidenceIds} onChange={setEvidenceIds} disabled={submitting} />
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <GhostBtn type="button" onClick={onCancel} disabled={submitting}>Cancel</GhostBtn>
        <PrimaryBtn type="submit" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</PrimaryBtn>
      </div>
    </form>
  )
}

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
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.getSkills(), api.getClaims(), api.getProjects()])
      .then(async ([{ skills: s }, { claims: c }, { projects: p }]) => {
        setSkills(s)
        setClaims(c)
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
    setCreating(true); setCreateError('')
    try {
      const { claim } = await api.createClaim(data)
      setClaims(prev => [claim, ...prev])
      setShowCreate(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create claim')
    } finally { setCreating(false) }
  }

  async function handleUpdate(id: string, data: { skillId: string; level: ClaimLevel; summary: string; evidenceIds: string[] }) {
    setUpdating(true); setUpdateError('')
    try {
      const { claim } = await api.updateClaim(id, data)
      setClaims(prev => prev.map(x => x.id === id ? claim : x))
      setEditingId(null)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Failed to update claim')
    } finally { setUpdating(false) }
  }

  async function handleDelete(id: string) {
    setDeletingId(id); setDeleteError(null)
    try {
      await api.deleteClaim(id)
      setClaims(prev => prev.filter(x => x.id !== id))
      setDeleteConfirmId(null)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete claim')
    } finally { setDeletingId(null) }
  }

  return (
    <AppShell>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ivory-100">Skill Claims</h1>
          <p className="mt-0.5 text-sm text-ivory-300/45">Declare your skills and back them with evidence.</p>
        </div>
        {!showCreate && (
          <PrimaryBtn onClick={() => { setShowCreate(true); setCreateError('') }}>+ New claim</PrimaryBtn>
        )}
      </div>

      {showCreate && (
        <div className="mb-8 rounded-2xl border border-navy-700 bg-navy-900 px-6 py-6">
          <h2 className="mb-5 text-base font-semibold text-ivory-100">New skill claim</h2>
          <ClaimForm
            skills={skills} allEvidence={allEvidence}
            initial={{ skillId: '', level: 'BEGINNER', summary: '', evidenceIds: [] }}
            lockSkill={false} submitLabel="Create claim"
            submitting={creating} error={createError}
            onSubmit={handleCreate}
            onCancel={() => { setShowCreate(false); setCreateError('') }}
          />
        </div>
      )}

      {loading && <InlineSpinner />}
      {!loading && fetchError && <ErrorBanner message={fetchError} />}

      {!loading && !fetchError && claims.length === 0 && !showCreate && (
        <EmptyState
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          title="No skill claims yet"
          description="Claim a skill and attach evidence to back it up."
          action={<PrimaryBtn onClick={() => setShowCreate(true)}>Make your first claim</PrimaryBtn>}
        />
      )}

      {!loading && claims.length > 0 && (
        <ul className="space-y-3">
          {claims.map(claim => (
            <li key={claim.id} className="rounded-2xl border border-navy-800 bg-navy-900">
              {editingId === claim.id ? (
                <div className="px-6 py-6">
                  <h2 className="mb-5 text-base font-semibold text-ivory-100">Edit claim</h2>
                  <ClaimForm
                    skills={skills} allEvidence={allEvidence}
                    initial={{ skillId: claim.skill.id, level: claim.level, summary: claim.summary ?? '', evidenceIds: claim.evidenceLinks.map(l => l.evidence.id) }}
                    lockSkill={true} submitLabel="Save changes"
                    submitting={updating} error={updateError}
                    onSubmit={data => handleUpdate(claim.id, data)}
                    onCancel={() => { setEditingId(null); setUpdateError('') }}
                  />
                </div>
              ) : (
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Skill name + badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-ivory-100">{claim.skill.name}</h2>
                        <Badge variant={LEVEL_VARIANTS[claim.level]} label={LEVEL_LABELS[claim.level]} />
                        <Badge variant={STATUS_VARIANTS[claim.status]} label={STATUS_LABELS[claim.status]} />
                      </div>
                      {claim.skill.category && (
                        <p className="mt-0.5 text-xs text-ivory-300/35">{claim.skill.category}</p>
                      )}
                      {claim.summary && (
                        <p className="mt-2 text-sm text-ivory-300/60">{claim.summary}</p>
                      )}
                      {/* Evidence chips */}
                      {claim.evidenceLinks.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {claim.evidenceLinks.map(({ evidence: ev }) => (
                            ev.url ? (
                              <a key={ev.id} href={ev.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-md border border-navy-700 bg-navy-800/60 px-2.5 py-1 text-xs text-ivory-300/55 transition hover:border-navy-500 hover:text-amber-light focus:outline-none focus:text-amber-light">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                {ev.title}
                              </a>
                            ) : (
                              <span key={ev.id} className="rounded-md border border-navy-700 bg-navy-800/60 px-2.5 py-1 text-xs text-ivory-300/40">
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
                          <span className="text-xs text-ivory-300/40">Delete?</span>
                          <DangerBtn onClick={() => handleDelete(claim.id)} disabled={deletingId === claim.id}>
                            {deletingId === claim.id ? '…' : 'Confirm'}
                          </DangerBtn>
                          <GhostBtn onClick={() => { setDeleteConfirmId(null); setDeleteError(null) }} className="px-3 py-1.5 text-xs">
                            Cancel
                          </GhostBtn>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(claim.id); setUpdateError('') }}
                            className="rounded-md border border-navy-700 px-3 py-1.5 text-xs text-ivory-300/60 transition hover:border-navy-500 hover:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-navy-500/40">
                            Edit
                          </button>
                          <button onClick={() => { setDeleteConfirmId(claim.id); setDeleteError(null) }}
                            className="rounded-md border border-navy-800 px-3 py-1.5 text-xs text-ivory-300/35 transition hover:border-red-500/50 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/30">
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {deleteError && deleteConfirmId === claim.id && (
                    <p className="mt-2 text-xs text-red-400">{deleteError}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
