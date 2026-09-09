export interface AuthUser {
  id: number
  username: string
  email: string
}

export function useAuth() {
  const raw = localStorage.getItem("user")
  const user: AuthUser | null = raw ? JSON.parse(raw) : null

  function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  return { user, logout }
}
