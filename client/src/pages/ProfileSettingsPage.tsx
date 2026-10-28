import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import { api } from '../lib/api'
import type { ProfileFormData } from '../types/auth'

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState(user?.username ?? '')
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setUsername(user?.username ?? '')
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
  }, [user?.username, user?.displayName, user?.bio])

  const portfolioUrl = user?.username
    ? `${window.location.origin}/portfolio/${user.username}`
    : null
  const previewName = displayName.trim() || user?.name || 'Your name'
  const initials = previewName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      const payload: Partial<ProfileFormData> = {}
      if (username.trim()) payload.username = username.trim()
      if (displayName.trim()) payload.displayName = displayName.trim()
      payload.bio = bio.trim()
      await api.updateProfile(payload)
      await refreshUser()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function copyUrl() {
    if (!portfolioUrl) return
    try {
      await navigator.clipboard.writeText(portfolioUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the URL. Select and copy it manually.')
    }
  }

  const inputClass =
    'w-full rounded-xl border border-navy-700 bg-navy-950/80 px-4 py-3 text-sm text-ivory-100 placeholder:text-ivory-300/30 outline-none transition focus:border-amber-light focus:ring-2 focus:ring-amber-light/15'

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 overflow-hidden rounded-3xl border border-navy-700 bg-gradient-to-br from-navy-900 via-navy-900 to-amber-accent/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-light/25 bg-amber-light/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-light">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-light" /> Account settings
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ivory-100 sm:text-4xl">Make your profile yours.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory-300/65 sm:text-base">
                Tell your story, highlight what you are building, and give people a portfolio worth exploring.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-navy-700 bg-navy-950/50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-accent text-sm font-bold text-navy-950">
                {initials || 'Y'}
              </div>
              <div>
                <p className="text-sm font-semibold text-ivory-100">{previewName}</p>
                <p className="text-xs text-ivory-300/50">Profile preview</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <form onSubmit={handleSubmit} className="overflow-hidden rounded-3xl border border-navy-700 bg-navy-900 shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 border-b border-navy-700 px-5 py-5 sm:px-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-light/10 text-amber-light">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-ivory-100">Public profile</h2>
                <p className="mt-1 text-xs text-ivory-300/50">These details appear on your portfolio.</p>
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="username" className="text-sm font-medium text-ivory-100">Username</label>
                  <span className="text-xs text-amber-light">Your unique URL</span>
                </div>
                <div className="flex overflow-hidden rounded-xl border border-navy-700 bg-navy-950/80 transition focus-within:border-amber-light focus-within:ring-2 focus-within:ring-amber-light/15">
                  <span className="hidden items-center border-r border-navy-700 bg-navy-800/70 px-3 text-xs text-ivory-300/45 sm:flex">/portfolio/</span>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="your-username"
                    maxLength={30}
                    autoComplete="off"
                    name="username"
                    aria-describedby="username-help"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ivory-100 placeholder:text-ivory-300/30 outline-none"
                  />
                </div>
                <p id="username-help" className="mt-2 text-xs leading-5 text-ivory-300/45">3–30 characters. Use lowercase letters, numbers, hyphens, or underscores.</p>
              </div>

              <div>
                <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-ivory-100">Display name</label>
                <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder={user?.name ?? 'Your name'} maxLength={60} autoComplete="off" name="displayName" className={inputClass} />
                <p className="mt-2 text-xs text-ivory-300/45">The name visitors see first.</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="bio" className="text-sm font-medium text-ivory-100">About you</label>
                  <span className={`text-xs tabular-nums ${bio.length >= 280 ? 'text-amber-light' : 'text-ivory-300/40'}`}>{bio.length}/300</span>
                </div>
                <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="What are you learning, building, or interested in?" maxLength={300} rows={5} name="bio" className={`${inputClass} resize-y leading-6`} />
                <p className="mt-2 text-xs text-ivory-300/45">Share your interests, strengths, and the work you want people to notice.</p>
              </div>

              {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
              {success && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">✓ Profile saved successfully.</div>}

              <div className="flex flex-col-reverse gap-3 border-t border-navy-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ivory-300/40">Changes update your public portfolio.</p>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-accent px-6 py-3 text-sm font-bold text-navy-950 shadow-lg shadow-amber-accent/15 transition hover:-translate-y-0.5 hover:bg-amber-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-light disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-950/30 border-t-navy-950" aria-hidden="true" />}
                  {saving ? 'Saving changes…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <section className="overflow-hidden rounded-3xl border border-amber-light/20 bg-gradient-to-br from-navy-900 to-navy-800/70 shadow-xl shadow-black/10">
              <div className="h-2 bg-gradient-to-r from-amber-accent via-amber-light to-amber-accent" />
              <div className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-light">Live preview</span>
                  <span className="rounded-full border border-navy-600 px-2.5 py-1 text-[10px] font-medium text-ivory-300/55">PREVIEW</span>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-light/30 bg-amber-light/10 text-xl font-bold text-amber-light">
                  {initials || 'Y'}
                </div>
                <h3 className="mt-4 break-words text-2xl font-semibold tracking-tight text-ivory-100">{previewName}</h3>
                <p className="mt-1 text-sm text-amber-light">{username ? `@${username}` : '@your-username'}</p>
                <p className="mt-4 min-h-[5rem] whitespace-pre-wrap break-words text-sm leading-6 text-ivory-300/65">{bio.trim() || 'Your short bio will appear here. Add a little about what you do and what you are passionate about.'}</p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-navy-700 pt-4">
                  <span className="rounded-full border border-navy-600 bg-navy-950/50 px-3 py-1.5 text-xs text-ivory-300/65">Projects</span>
                  <span className="rounded-full border border-navy-600 bg-navy-950/50 px-3 py-1.5 text-xs text-ivory-300/65">Skills</span>
                  <span className="rounded-full border border-navy-600 bg-navy-950/50 px-3 py-1.5 text-xs text-ivory-300/65">Evidence</span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-navy-700 bg-navy-900 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-light/10 text-amber-light">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ivory-100">Share your portfolio</h3>
                  <p className="mt-1 text-xs leading-5 text-ivory-300/50">Let others explore your projects, evidence, and skill claims.</p>
                </div>
              </div>
              {portfolioUrl ? (
                <>
                  <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-4 block break-all rounded-xl border border-navy-700 bg-navy-950/70 p-3 text-xs leading-5 text-amber-light transition hover:border-amber-light/40">{portfolioUrl}</a>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={copyUrl} className="rounded-xl border border-navy-600 px-3 py-2.5 text-xs font-semibold text-ivory-100 transition hover:border-amber-light/50 hover:text-amber-light">{copied ? 'Copied!' : 'Copy link'}</button>
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-amber-accent px-3 py-2.5 text-center text-xs font-bold text-navy-950 transition hover:bg-amber-light">Open portfolio ↗</a>
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-navy-600 p-4 text-xs leading-5 text-ivory-300/55">Choose a username and save your profile to create a shareable link.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}
