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

  // Keep form in sync if user object updates
  useEffect(() => {
    setUsername(user?.username ?? '')
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
  }, [user?.username, user?.displayName, user?.bio])

  const portfolioUrl = user?.username
    ? `${window.location.origin}/portfolio/${user.username}`
    : null

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
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function copyUrl() {
    if (!portfolioUrl) return
    await navigator.clipboard.writeText(portfolioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-ivory-300/50">Account</p>
        <h1 className="mt-1 text-2xl font-semibold text-ivory-100">Profile Settings</h1>
        <p className="mt-0.5 text-sm text-ivory-300/50">
          Set your public username and portfolio details.
        </p>
      </div>

      {/* Portfolio URL banner */}
      {portfolioUrl && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-navy-700 bg-navy-900 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-amber-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm text-ivory-300/70 hover:text-amber-light transition"
          >
            {portfolioUrl}
          </a>
          <button
            onClick={copyUrl}
            className="shrink-0 rounded-lg border border-navy-700 px-3 py-1 text-xs text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ivory-300/70">
            Username <span className="text-ivory-300/40">(used in your portfolio URL)</span>
          </label>
          <div className="flex items-center rounded-xl border border-navy-700 bg-navy-900 focus-within:border-navy-500 transition">
            <span className="pl-3 text-sm text-ivory-300/40 select-none">proofstack.app/portfolio/</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="your-username"
              maxLength={30}
              autoComplete="off"
              name="username"
              className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-ivory-100 placeholder-ivory-300/30 outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-ivory-300/40">3–30 characters: lowercase letters, numbers, hyphens, underscores</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ivory-300/70">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder={user?.name ?? 'Your name'}
            maxLength={60}
            autoComplete="off"
            name="displayName"
            className="w-full rounded-xl border border-navy-700 bg-navy-900 px-3 py-2.5 text-sm text-ivory-100 placeholder-ivory-300/30 outline-none focus:border-navy-500 transition"
          />
          <p className="mt-1 text-xs text-ivory-300/40">Shown on your public portfolio. Defaults to your account name.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ivory-300/70">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="A short description about yourself…"
            maxLength={300}
            rows={4}
            name="bio"
            className="w-full resize-none rounded-xl border border-navy-700 bg-navy-900 px-3 py-2.5 text-sm text-ivory-100 placeholder-ivory-300/30 outline-none focus:border-navy-500 transition"
          />
          <p className="mt-1 text-xs text-ivory-300/40">{bio.length}/300</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</p>
        )}
        {success && (
          <p className="rounded-lg border border-green-800/40 bg-green-900/20 px-3 py-2 text-sm text-green-400">Profile saved successfully.</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-amber-accent px-5 py-2.5 text-sm font-semibold text-navy-950 transition hover:bg-amber-light disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </AppShell>
  )
}
