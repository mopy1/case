import { Navigate, Outlet } from "react-router-dom"

/** Exige sesión iniciada — si no hay token, manda a /login. */
export function ProtectedRoute() {
  const token = localStorage.getItem("token")
  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
