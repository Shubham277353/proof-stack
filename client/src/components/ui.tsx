// Shared UI primitives — keep this file small and focused

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-navy-700 border-t-amber-light ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function InlineSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-400">
      {message}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-700 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-800 text-ivory-300/30">
        {icon}
      </div>
      <p className="text-sm font-medium text-ivory-300/60">{title}</p>
      <p className="mt-1 text-sm text-ivory-300/30">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// Consistent status badge — used on Projects, Claims, Reviews, Portfolio
export type BadgeVariant = 'draft' | 'published' | 'archived' | 'pending' | 'accepted' | 'declined' | 'completed' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'beginner' | 'intermediate' | 'advanced' | 'expert'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  draft:        'bg-navy-700/80 text-ivory-300/60 border-navy-600',
  published:    'bg-emerald-900/50 text-emerald-300 border-emerald-800/40',
  archived:     'bg-navy-800 text-ivory-300/40 border-navy-700',
  pending:      'bg-amber-900/40 text-amber-300 border-amber-800/40',
  accepted:     'bg-blue-900/40 text-blue-300 border-blue-800/40',
  declined:     'bg-red-900/40 text-red-400 border-red-800/40',
  completed:    'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
  submitted:    'bg-blue-900/30 text-blue-300 border-blue-800/30',
  under_review: 'bg-amber-900/30 text-amber-300 border-amber-800/30',
  approved:     'bg-emerald-900/40 text-emerald-300 border-emerald-800/40',
  rejected:     'bg-red-900/40 text-red-400 border-red-800/40',
  beginner:     'bg-slate-700/60 text-slate-300 border-slate-600/40',
  intermediate: 'bg-blue-900/50 text-blue-300 border-blue-800/40',
  advanced:     'bg-violet-900/50 text-violet-300 border-violet-800/40',
  expert:       'bg-amber-900/50 text-amber-300 border-amber-800/40',
}

export function Badge({ variant, label }: { variant: BadgeVariant; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[variant]}`}>
      {label}
    </span>
  )
}

// Consistent input/select/textarea class builder
export function inputCls(hasError = false) {
  return `w-full rounded-lg border ${hasError ? 'border-red-500/60' : 'border-navy-600'} bg-navy-800 px-4 py-2.5 text-sm text-ivory-100 placeholder-navy-400 outline-none transition focus:border-amber-light focus:ring-1 focus:ring-amber-light/40 disabled:opacity-50`
}

// Primary action button
export function PrimaryBtn({
  children,
  disabled,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg bg-amber-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-light focus:outline-none focus:ring-2 focus:ring-amber-light/50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  )
}

// Ghost/secondary button
export function GhostBtn({
  children,
  disabled,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg border border-navy-600 px-4 py-2 text-sm text-ivory-300/80 transition hover:border-navy-400 hover:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-navy-500/50 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

// Danger text button (for delete confirm)
export function DangerBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-lg bg-red-700/70 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-600/70 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
    >
      {children}
    </button>
  )
}
