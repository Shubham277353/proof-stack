import { useState, useEffect, type FormEvent } from 'react'
import AppShell from '../components/AppShell'
import EvidencePanel from '../components/EvidencePanel'
import { api } from '../lib/api'
import type { Project, ProjectFormData, ProjectStatus } from '../types/project'

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
}

const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-navy-700 text-ivory-300/70',
  PUBLISHED: 'bg-emerald-900/60 text-emerald-300',
  ARCHIVED: 'bg-navy-800 text-ivory-300/40',
}

const EMPTY_FORM: ProjectFormData = {
  title: '',
  description: '',
  repoUrl: '',
  liveUrl: '',
  status: 'DRAFT',
}

function isValidUrl(v: string) {
  if (!v) return true
  try { new URL(v); return true } catch { return false }
}

// ── sub-components ────────────────────────────────────────────────────────────

interface FormProps {
  initial: ProjectFormData
  submitLabel: string
  submitting: boolean
  error: string
  onSubmit: (data: ProjectFormData) => void
  onCancel: () => void
}

function ProjectForm({ initial, submitLabel, submitting, error, onSubmit, onCancel }: FormProps) {
  const [form, setForm] = useState<ProjectFormData>(initial)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setFieldErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ProjectFormData, string>> = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    else if (form.title.trim().length > 120) errs.title = 'Max 120 characters'
    if (!isValidUrl(form.repoUrl.trim())) errs.repoUrl = 'Must be a valid URL'
    if (!isValidUrl(form.liveUrl.trim())) errs.liveUrl = 'Must be a valid URL'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (validate()) onSubmit(form)
  }

  const inputCls = (err?: string) =>
    `w-full rounded-lg border ${err ? 'border-red-500/60' : 'border-navy-600'} bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50`

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          name="project-title"
          autoComplete="off"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          disabled={submitting}
          placeholder="My awesome project"
          className={inputCls(fieldErrors.title)}
        />
        {fieldErrors.title && <p className="mt-1 text-xs text-red-400">{fieldErrors.title}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="What does this project demonstrate?"
          className={`${inputCls()} resize-none`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            GitHub URL
          </label>
          <input
            type="text"
            name="project-repo-url"
            autoComplete="off"
            value={form.repoUrl}
            onChange={e => set('repoUrl', e.target.value)}
            disabled={submitting}
            placeholder="https://github.com/..."
            className={inputCls(fieldErrors.repoUrl)}
          />
          {fieldErrors.repoUrl && <p className="mt-1 text-xs text-red-400">{fieldErrors.repoUrl}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
            Live URL
          </label>
          <input
            type="text"
            name="project-live-url"
            autoComplete="off"
            value={form.liveUrl}
            onChange={e => set('liveUrl', e.target.value)}
            disabled={submitting}
            placeholder="https://..."
            className={inputCls(fieldErrors.liveUrl)}
          />
          {fieldErrors.liveUrl && <p className="mt-1 text-xs text-red-400">{fieldErrors.liveUrl}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
          Status
        </label>
        <select
          value={form.status}
          onChange={e => set('status', e.target.value as ProjectStatus)}
          disabled={submitting}
          className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50"
        >
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    api.getProjects()
      .then(({ projects: p }) => setProjects(p))
      .catch(e => setFetchError(e instanceof Error ? e.message : 'Failed to load projects'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data: ProjectFormData) {
    setCreating(true)
    setCreateError('')
    try {
      const { project } = await api.createProject(data)
      setProjects(p => [project, ...p])
      setShowCreate(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, data: ProjectFormData) {
    setUpdating(true)
    setUpdateError('')
    try {
      const { project } = await api.updateProject(id, data)
      setProjects(p => p.map(x => x.id === id ? project : x))
      setEditingId(null)
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : 'Failed to update project')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await api.deleteProject(id)
      setProjects(p => p.filter(x => x.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete project')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ivory-100">Projects</h1>
          <p className="mt-0.5 text-sm text-ivory-300/50">
            Your portfolio projects and evidence.
          </p>
        </div>
        {!showCreate && (
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            className="rounded-lg bg-amber-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-light"
          >
            + New project
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-8 rounded-2xl border border-navy-700 bg-navy-900 px-6 py-6 shadow-xl">
          <h2 className="mb-5 text-base font-semibold text-ivory-100">New project</h2>
          <ProjectForm
            initial={EMPTY_FORM}
            submitLabel="Create project"
            submitting={creating}
            error={createError}
            onSubmit={handleCreate}
            onCancel={() => { setShowCreate(false); setCreateError('') }}
          />
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="py-20 text-center text-sm text-ivory-300/40">Loading projects…</div>
      )}

      {!loading && fetchError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError}
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && projects.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-700 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-ivory-300/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-ivory-300/60">No projects yet</p>
          <p className="mt-1 text-sm text-ivory-300/30">Create your first project to start building your portfolio.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 rounded-lg bg-amber-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-amber-light"
          >
            Create a project
          </button>
        </div>
      )}

      {/* Project list */}
      {!loading && projects.length > 0 && (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project.id} className="rounded-2xl border border-navy-700 bg-navy-900 shadow-md">
              {editingId === project.id ? (
                <div className="px-6 py-6">
                  <h2 className="mb-5 text-base font-semibold text-ivory-100">Edit project</h2>
                  <ProjectForm
                    initial={{
                      title: project.title,
                      description: project.description ?? '',
                      repoUrl: project.repoUrl ?? '',
                      liveUrl: project.liveUrl ?? '',
                      status: project.status,
                    }}
                    submitLabel="Save changes"
                    submitting={updating}
                    error={updateError}
                    onSubmit={data => handleUpdate(project.id, data)}
                    onCancel={() => { setEditingId(null); setUpdateError('') }}
                  />
                </div>
              ) : (
                <div className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="truncate text-base font-semibold text-ivory-100">
                          {project.title}
                        </h2>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-1.5 text-sm text-ivory-300/60 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {(project.repoUrl || project.liveUrl) && (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {project.repoUrl && (
                            <a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-ivory-300/50 transition hover:text-amber-light"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                              </svg>
                              Repository
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-ivory-300/50 transition hover:text-amber-light"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Live demo
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                        className="rounded-md border border-navy-700 px-3 py-1.5 text-xs text-ivory-300/50 transition hover:border-navy-500 hover:text-ivory-100"
                      >
                        {expandedId === project.id ? 'Hide evidence' : 'Evidence'}
                      </button>
                      {deleteConfirmId === project.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-ivory-300/50">Delete?</span>
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deletingId === project.id}
                            className="rounded-md bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            {deletingId === project.id ? 'Deleting…' : 'Confirm'}
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
                            onClick={() => { setEditingId(project.id); setUpdateError('') }}
                            className="rounded-md border border-navy-600 px-3 py-1.5 text-xs text-ivory-300 transition hover:border-navy-400 hover:text-ivory-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(project.id)}
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
              {expandedId === project.id && editingId !== project.id && (
                <EvidencePanel projectId={project.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
