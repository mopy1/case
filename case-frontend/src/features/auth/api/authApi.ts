import type { LoginRequest, RegisterRequest, AuthResponse } from "../types/auth.types"
import { API_URL } from "@/lib/api"

const AUTH_URL = `${API_URL}/api/auth`

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

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
