import { apiFetch } from "@/lib/api"
import type { NotaRequest, NotaResponse } from "../types/notes.type"

export function getNotes(proyectoId: number): Promise<NotaResponse[]> {
  return apiFetch(`/api/proyectos/${proyectoId}/notas`, { errorFallback: "Error al obtener las notas" })
}

export function createNote(proyectoId: number, nota: NotaRequest): Promise<NotaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/notas`, {
    method: "POST",
    body: JSON.stringify(nota),
    errorFallback: "Error al crear la nota",
  })
}
