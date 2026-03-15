import { Navigate, Outlet } from 'react-router-dom'

export default function AuthGuard() {
  if (localStorage.getItem('dokon_authed') !== 'true') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
