import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth.types"
import { API_URL, parseErrorMessage } from "@/lib/api"

// No usa `apiFetch`: login/registro van sin token, así que un 401 acá no es "sesión vencida" — no
// debe limpiar la sesión ni redirigir a /login como hace `apiFetch` ante un 401.
const AUTH_URL = `${API_URL}/api/auth`

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al iniciar sesión"))
  }

  return response.json()
}

export async function register(credentials: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Error al registrar"))
  }

  return response.json()
}
