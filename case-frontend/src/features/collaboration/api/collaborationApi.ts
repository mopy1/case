import { apiFetch } from "@/lib/api"
import type { CollaboratorPresence } from "../types/collaboration.types"

export interface PresencePayload {
  clientId: string
  username: string
  color: string
  cursor: { x: number; y: number }
  selectedEntityId?: number | null
}

export async function syncPresenceApi(
  proyectoId: number,
  payload: PresencePayload
): Promise<CollaboratorPresence[]> {
  return apiFetch<CollaboratorPresence[]>(
    `/api/proyectos/${proyectoId}/colaboracion/presencia`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
}
