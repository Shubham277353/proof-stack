import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../lib/api'
import type { Evidence, EvidenceFormData } from '../types/evidence'

interface Props {
  projectId: string
}

const EMPTY: EvidenceFormData = { title: '', description: '', url: '' }

function isValidUrl(v: string) {
  if (!v.trim()) return true
  try { new URL(v.trim()); return true } catch { return false }
}

const inputCls = (err?: string) =>
  `w-full rounded-lg border ${err ? 'border-red-500/60' : 'border-navy-700'} bg-navy-800/80 px-3 py-2 text-sm text-ivory-100 placeholder-navy-500 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50`

interface EvidenceFormProps {
  initial: EvidenceFormData
  submitLabel: string
  submitting: boolean
  error: string
  onSubmit: (data: EvidenceFormData) => void
  onCancel: () => void
}

function EvidenceForm({ initial, submitLabel, submitting, error, onSubmit, onCancel }: EvidenceFormProps) {
  const [form, setForm] = useState<EvidenceFormData>(initial)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof EvidenceFormData, string>>>({})

  function set<K extends keyof EvidenceFormData>(key: K, value: string) {
    setForm(f => ({ ...f, [key]: value }))
    setFieldErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof EvidenceFormData, string>> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.trim().length > 200) errs.title = 'Max 200 characters'
    if (!isValidUrl(form.url)) errs.url = 'Must be a valid URL'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3 rounded-xl border border-navy-700 bg-navy-800/40 p-4">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ivory-300/50">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="evidence-title"
          autoComplete="off"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          disabled={submitting}
          placeholder="e.g. GitHub commit history"
          className={inputCls(fieldErrors.title)}
        />
        {fieldErrors.title && <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ivory-300/50">
          URL
        </label>
        <input
          type="text"
          name="evidence-url"
          autoComplete="off"
          value={form.url}
          onChange={e => set('url', e.target.value)}
          disabled={submitting}
          placeholder="https://..."
          className={inputCls(fieldErrors.url)}
        />
        {fieldErrors.url && <p className="mt-1 text-xs text-red-400">{fieldErrors.url}</p>}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-ivory-300/50">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          disabled={submitting}
          rows={2}
          placeholder="What does this evidence demonstrate?"
          className={`${inputCls()} resize-none`}
        />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-navy-600 px-3 py-1.5 text-xs text-ivory-300 transition hover:border-navy-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber-accent px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-light disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function EvidencePanel({ projectId }: Props) {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    api.getEvidence(projectId)
      .then(({ evidence: e }) => setEvidence(e))
      .catch(e => setFetchError(e instanceof Error ? e.message : 'Failed to load evidence'))
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleAdd(data: EvidenceFormData) {
    setAdding(true)
    setAddError('')
    try {
      const { evidence: e } = await api.createEvidence(projectId, data)
      setEvidence(prev => [...prev, e])
      setShowAdd(false)
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to add evidence')
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdate(id: string, data: EvidenceFormData) {
    setUpdating(true)
    setUpdateError('')
    try {
      const { evidence: e } = await api.updateEvidence(projectId, id, data)
      setEvidence(prev => prev.map(x => x.id === id ? e : x))
      setEditingId(null)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Failed to update evidence')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.deleteEvidence(projectId, id)
      setEvidence(prev => prev.filter(x => x.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete evidence')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  return (
    <div className="border-t border-navy-800 px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ivory-300/40">
          Evidence {!loading && `· ${evidence.length}`}
        </span>
        {!showAdd && (
          <button
            onClick={() => { setShowAdd(true); setAddError('') }}
            className="rounded-md border border-navy-700 px-2.5 py-1 text-xs text-ivory-300/60 transition hover:border-amber-light/50 hover:text-amber-light"
          >
            + Add
          </button>
        )}
      </div>

      {loading && (
        <p className="py-3 text-xs text-ivory-300/30">Loading…</p>
      )}

      {!loading && fetchError && (
        <p className="py-2 text-xs text-red-400">{fetchError}</p>
      )}

      {!loading && !fetchError && evidence.length === 0 && !showAdd && (
        <div className="rounded-lg border border-dashed border-navy-700 py-5 text-center">
          <p className="text-xs text-ivory-300/30">No evidence yet.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-2 text-xs text-amber-light/70 hover:text-amber-light transition"
          >
            Add the first piece of evidence
          </button>
        </div>
      )}

      {showAdd && (
        <div className="mb-3">
          <EvidenceForm
            initial={EMPTY}
            submitLabel="Add evidence"
            submitting={adding}
            error={addError}
            onSubmit={handleAdd}
            onCancel={() => { setShowAdd(false); setAddError('') }}
          />
        </div>
      )}

      {!loading && evidence.length > 0 && (
        <ul className="space-y-2">
          {evidence.map(item => (
            <li key={item.id}>
              {editingId === item.id ? (
                <EvidenceForm
                  initial={{ title: item.title, description: item.description ?? '', url: item.url ?? '' }}
                  submitLabel="Save"
                  submitting={updating}
                  error={updateError}
                  onSubmit={data => handleUpdate(item.id, data)}
                  onCancel={() => { setEditingId(null); setUpdateError('') }}
                />
              ) : (
                <div className="group flex items-start justify-between gap-3 rounded-lg border border-navy-800 bg-navy-800/30 px-3 py-2.5 transition hover:border-navy-700">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-medium text-ivory-100 hover:text-amber-light transition"
                        >
                          {item.title}
                        </a>
                      ) : (
                        <span className="truncate text-sm font-medium text-ivory-100">{item.title}</span>
                      )}
                      {item.url && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 shrink-0 text-ivory-300/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-ivory-300/40 line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                    {deleteConfirmId === item.id ? (
                      <>
                        <span className="text-xs text-ivory-300/40">Delete?</span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {deletingId === item.id ? '…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded px-2 py-1 text-xs text-ivory-300/50 hover:text-ivory-100"
                        >
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(item.id); setUpdateError('') }}
                          className="rounded px-2 py-1 text-xs text-ivory-300/50 hover:text-ivory-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="rounded px-2 py-1 text-xs text-ivory-300/30 hover:text-red-400 transition"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
