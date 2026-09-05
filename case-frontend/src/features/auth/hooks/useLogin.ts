import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { LoginRequest, AuthResponse } from "../types/auth.types"

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const login = async (credentials: LoginRequest) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message ?? "Error al iniciar sesión")
      }

      const data = await response.json()
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
        fullname: data.fullname,
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
