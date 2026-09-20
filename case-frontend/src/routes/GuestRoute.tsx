import { Navigate, Outlet } from "react-router-dom"

/** Para /login y /register — si ya hay sesión, no tiene sentido ver el formulario de nuevo. */
export function GuestRoute() {
  const token = localStorage.getItem("token")
  if (token) return <Navigate to="/proyectos" replace />
  return <Outlet />
}
