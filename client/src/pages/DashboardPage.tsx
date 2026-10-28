import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppShell from '../components/AppShell'

export default function DashboardPage() {
  const { user } = useAuth()

  const portfolioUrl = user?.username ? `/portfolio/${user.username}` : null

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-ivory-300/50">
          Welcome back
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ivory-100">{user?.name}</h1>
        <p className="mt-0.5 text-sm text-ivory-300/50">{user?.email}</p>
      </div>

      {/* Portfolio CTA */}
      <div className="mb-6 rounded-2xl border border-amber-accent/30 bg-amber-accent/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ivory-100">Your Public Portfolio</p>
            {portfolioUrl ? (
              <p className="mt-0.5 text-sm text-ivory-300/50">
                <span className="font-mono text-amber-light">{window.location.origin}{portfolioUrl}</span>
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-ivory-300/50">Set a username to get your shareable portfolio URL.</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {portfolioUrl && (
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-navy-700 px-4 py-2 text-sm text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100"
              >
                View Portfolio
              </a>
            )}
            <Link
              to="/settings/profile"
              className="rounded-xl bg-amber-accent px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-amber-light"
            >
              {portfolioUrl ? 'Edit Profile' : 'Set Up Portfolio'}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/projects"
          className="group rounded-2xl border border-navy-700 bg-navy-900 p-6 transition hover:border-navy-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-amber-light">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          </div>
          <p className="font-semibold text-ivory-100 group-hover:text-amber-light transition">Projects</p>
          <p className="mt-1 text-sm text-ivory-300/50">Manage your portfolio projects and evidence.</p>
        </Link>

        <Link
          to="/claims"
          className="group rounded-2xl border border-navy-700 bg-navy-900 p-6 transition hover:border-navy-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-amber-light">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="font-semibold text-ivory-100 group-hover:text-amber-light transition">Skill Claims</p>
          <p className="mt-1 text-sm text-ivory-300/50">Declare your skills and back them with evidence.</p>
        </Link>

        <Link
          to="/reviews"
          className="group rounded-2xl border border-navy-700 bg-navy-900 p-6 transition hover:border-navy-500"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-amber-light">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <p className="font-semibold text-ivory-100 group-hover:text-amber-light transition">Peer Reviews</p>
          <p className="mt-1 text-sm text-ivory-300/50">Request and give reviews on skill claims.</p>
        </Link>
      </div>
    </AppShell>
  )
}
