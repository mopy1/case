import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { LoginRequest } from "../types/auth.types"
import { login as loginRequest } from "../api/authApi"

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const login = async (credentials: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loginRequest(credentials)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
      }))

      navigate("/")

    } catch (err: any) {
      setError(err.message || "No se pudo conectar con el servidor")
    } finally {

      setLoading(false)
    }
  }
  return { login, loading, error }
}
