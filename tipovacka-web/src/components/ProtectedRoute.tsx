import { Navigate, Outlet } from 'react-router-dom'
import { getToken } from '../api/client'

/** Propustí dál jen přihlášeného uživatele (token v localStorage), jinak přesměruje na /login. */
export default function ProtectedRoute() {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
