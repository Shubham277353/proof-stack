import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'
import { InlineSpinner } from '../components/ui'
import { api } from '../lib/api'

interface Stats {
  projects: number
  publishedProjects: number
  claims: number
  approvedClaims: number
  reviews: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [statsError, setStatsError] = useState(false)

  useEffect(() => {
    Promise.all([api.getProjects(), api.getClaims(), api.getReviews()])
      .then(([{ projects }, { claims }, { requests }]) => {
        setStats({
          projects: projects.length,
          publishedProjects: projects.filter(p => p.status === 'PUBLISHED').length,
          claims: claims.length,
          approvedClaims: claims.filter(c => c.status === 'APPROVED').length,
          reviews: requests.length,
        })
      })
      .catch(() => setStatsError(true))
  }, [])

  const portfolioUrl = user?.username ? `/portfolio/${user.username}` : null

  return (
    <AppShell>
      {/* Welcome header */}
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-ivory-300/40">Welcome back</p>
        <h1 className="mt-1 text-2xl font-semibold text-ivory-100">{user?.name}</h1>
        <p className="mt-0.5 text-sm text-ivory-300/40">{user?.email}</p>
      </div>

      {/* Stats row */}
      <div className="mb-8">
        {stats === null && !statsError && <InlineSpinner />}
        {statsError && (
          <p className="text-xs text-ivory-300/30">Could not load stats.</p>
        )}
        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Projects', value: stats.projects, sub: `${stats.publishedProjects} published` },
              { label: 'Skill Claims', value: stats.claims, sub: `${stats.approvedClaims} approved` },
              { label: 'Reviews', value: stats.reviews, sub: 'total requests' },
              { label: 'Portfolio', value: portfolioUrl ? '✓' : '—', sub: portfolioUrl ? 'live' : 'set username' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl border border-navy-800 bg-navy-900 px-4 py-3">
                <p className="text-xl font-bold text-ivory-100">{value}</p>
                <p className="text-xs font-medium text-ivory-300/60">{label}</p>
                <p className="mt-0.5 text-xs text-ivory-300/35">{sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio CTA */}
      <div className="mb-8 rounded-2xl border border-amber-accent/25 bg-amber-accent/5 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ivory-100">Your Public Portfolio</p>
            {portfolioUrl ? (
              <p className="mt-0.5 text-sm text-ivory-300/50">
                <span className="font-mono text-amber-light/80">{window.location.origin}{portfolioUrl}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-ivory-300/40">Set a username to get your shareable portfolio URL.</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {portfolioUrl && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-navy-700 px-4 py-2 text-sm text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50"
              >
                View Portfolio
              </a>
            )}
            <Link
              to="/settings/profile"
              className="rounded-lg bg-amber-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-light focus:outline-none focus:ring-2 focus:ring-amber-light/50"
            >
              {portfolioUrl ? 'Edit Profile' : 'Set Up Portfolio'}
            </Link>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            to: '/projects',
            label: 'Projects',
            description: 'Manage your portfolio projects and evidence.',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
              </svg>
            ),
          },
          {
            to: '/claims',
            label: 'Skill Claims',
            description: 'Declare your skills and back them with evidence.',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            ),
          },
          {
            to: '/reviews',
            label: 'Peer Reviews',
            description: 'Request and give reviews on skill claims.',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            ),
          },
          {
            to: '/settings/profile',
            label: 'Profile Settings',
            description: 'Set your public username, display name, and bio.',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          },
        ].map(({ to, label, description, icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-2xl border border-navy-800 bg-navy-900 p-5 transition hover:border-navy-600 focus:outline-none focus:ring-2 focus:ring-amber-light/40"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-navy-800 text-amber-light group-hover:bg-navy-700 transition">
              {icon}
            </div>
            <p className="font-semibold text-ivory-100 group-hover:text-amber-light transition">{label}</p>
            <p className="mt-1 text-sm text-ivory-300/45">{description}</p>
          </Link>
        ))}
      </div>
    </AppShell>
  )
}
