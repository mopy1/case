import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { RegisterRequest } from "../types/auth.types"
import { register as registerRequest } from "../api/authApi"
import { mensajeDeError } from "@/lib/api"

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const register = async (credentials: RegisterRequest) => {
    setLoading(true)
    setError(null)
    try {
      const data = await registerRequest(credentials)
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
      }))

      navigate("/")

    } catch (err) {
      setError(mensajeDeError(err))
    } finally {
      setLoading(false)
    }
  }
  return { register, loading, error }
}
