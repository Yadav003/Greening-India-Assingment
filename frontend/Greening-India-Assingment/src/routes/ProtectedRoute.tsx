import { Navigate, Outlet } from 'react-router-dom'
import Loader from '../components/Loader'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute() {
  const { token, isInitializing } = useAuth()

  if (isInitializing) {
    return <Loader label="Restoring your session..." />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
