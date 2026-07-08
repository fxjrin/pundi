import { Navigate, Outlet } from 'react-router'
import { useAuth } from '@/hooks/use-auth'

export function RequireAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return <Outlet />
}

/** For /login and /register: bounce an already-logged-in user to their home. */
export function RedirectIfAuthed() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />

  return <Outlet />
}
