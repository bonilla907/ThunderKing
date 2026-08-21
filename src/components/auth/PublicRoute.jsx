import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from '../ui/FullPageLoader'

export function PublicRoute() {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullPageLoader message="Cargando..." />
  if (user && profile) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
