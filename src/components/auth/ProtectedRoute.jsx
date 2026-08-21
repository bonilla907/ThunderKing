import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { FullPageLoader } from '../ui/FullPageLoader'

export function ProtectedRoute() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader message="Verificando sesión..." />
  if (!user || !profile) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
