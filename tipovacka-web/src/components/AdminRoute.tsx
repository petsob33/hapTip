import { Navigate, Outlet } from 'react-router-dom'
import { useCurrentUser } from '../api/hooks/useCurrentUser'

/** Propustí dál jen admina (h_admin === 'A'), jinak přesměruje na /zapasy. */
export default function AdminRoute() {
  const { data: user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <p className="p-6 text-sm text-slate-400">Načítání…</p>
  }

  if (user?.h_admin !== 'A') {
    return <Navigate to="/zapasy" replace />
  }

  return <Outlet />
}
