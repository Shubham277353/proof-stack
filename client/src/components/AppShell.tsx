import { type ReactNode } from 'react'
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

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-navy-950">
      <header className="border-b border-navy-800 bg-navy-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold tracking-tight text-ivory-100">
              Proof<span className="text-amber-light">stack</span>
            </span>
            <nav className="flex items-center gap-1">
              {navLinks.map(({ to, label }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'bg-navy-800 text-ivory-100'
                        : 'text-ivory-300/60 hover:text-ivory-100'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-navy-700 px-3 py-1.5 text-sm text-ivory-300/70 transition hover:border-navy-500 hover:text-ivory-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {children}
      </main>
    </div>
  )
}
