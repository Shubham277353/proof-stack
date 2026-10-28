import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-ivory-300 text-sm">Loading…</span>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}
