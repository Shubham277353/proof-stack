import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields.')
      return
    }

    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16 bg-navy-950">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="mb-10 text-center">
          <span className="text-2xl font-bold tracking-tight text-ivory-100">
            Proof<span className="text-amber-light">stack</span>
          </span>
          <p className="mt-2 text-sm text-ivory-300/70">
            Show the work behind your skills.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-navy-700 bg-navy-900 px-8 py-10 shadow-xl">
          <h1 className="mb-6 text-xl font-semibold text-ivory-100">
            Sign in to your account
          </h1>

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ivory-300/60">
                Password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={submitting}
                className="w-full rounded-lg border border-navy-600 bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-amber-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-ivory-300/50">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-amber-light hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
