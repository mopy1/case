import { API_URL } from "@/lib/api"
import type { NotaRequest, NotaResponse } from "../types/notes.type"

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` }
}

export async function getNotes(proyectoId: number): Promise<NotaResponse[]> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/notas`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al obtener las notas"))
  return response.json()
}

export async function createNote(proyectoId: number, nota: NotaRequest): Promise<NotaResponse> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/notas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(nota),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al crear la nota"))
  return response.json()
}
