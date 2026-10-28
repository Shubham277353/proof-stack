import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import type { AuthUser } from '../types/auth'
import { api } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('ps_token')
  )
  const [loading, setLoading] = useState(true)

  // On mount, validate stored token against /api/auth/me
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => {
        localStorage.removeItem('ps_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  function persist(t: string, u: AuthUser) {
    localStorage.setItem('ps_token', t)
    setToken(t)
    setUser(u)
  }

  async function login(email: string, password: string) {
    const { user: u, token: t } = await api.login(email, password)
    persist(t, u)
  }

  async function register(name: string, email: string, password: string) {
    const { user: u, token: t } = await api.register(name, email, password)
    persist(t, u)
  }

  function logout() {
    localStorage.removeItem('ps_token')
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    const { user: u } = await api.me()
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
