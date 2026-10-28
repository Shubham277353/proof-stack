import { type ReactNode, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: ReactNode
}

const navLinks = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/projects', label: 'Projects' },
  { to: '/claims', label: 'Skill Claims' },
  { to: '/reviews', label: 'Peer Reviews' },
  { to: '/settings/profile', label: 'Profile' },
]

export default function AppShell({ children }: Props) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <header className="sticky top-0 z-20 border-b border-navy-800 bg-navy-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4">
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="shrink-0 rounded text-lg font-bold tracking-tight text-ivory-100 focus:outline-none focus:ring-2 focus:ring-amber-light/50"
          >
            Proof<span className="text-amber-light">stack</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-0.5 md:flex">
            {navLinks.map(({ to, label }) => {
              const active = isActive(to)
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-light/40 ${
                    active
                      ? 'bg-navy-800 text-ivory-100'
                      : 'text-ivory-300/60 hover:bg-navy-900 hover:text-ivory-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleLogout}
              className="hidden rounded-lg border border-navy-700 px-3 py-2 text-sm font-medium text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50 sm:inline-flex"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-navy-700 bg-navy-900 text-ivory-100 transition hover:border-amber-light/40 hover:text-amber-light focus:outline-none focus:ring-2 focus:ring-amber-light/40 md:hidden"
            >
              {menuOpen ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-navigation" className="border-t border-navy-800 bg-navy-950 px-4 pb-4 pt-3 md:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto flex max-w-5xl flex-col gap-1">
              {navLinks.map(({ to, label }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? 'border border-amber-light/20 bg-amber-light/10 text-amber-light'
                        : 'border border-transparent text-ivory-300/70 hover:bg-navy-900 hover:text-ivory-100'
                    }`}
                  >
                    {label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-amber-light" />}
                  </Link>
                )
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 w-full rounded-xl border border-navy-700 px-4 py-3 text-left text-sm font-medium text-ivory-300/70 transition hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-amber-light/40 sm:hidden"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8 md:py-10">
        {children}
      </main>
    </div>
  )
}
