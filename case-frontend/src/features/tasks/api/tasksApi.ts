import { API_URL } from "@/lib/api"
import type { CambiarEstadoRequest, TareaRequest, TareaResponse } from "../types/tasks.type"

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}` }
}

export async function getTasks(proyectoId: number): Promise<TareaResponse[]> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/tareas`, {
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al obtener las tareas"))
  return response.json()
}

export async function createTask(proyectoId: number, tarea: TareaRequest): Promise<TareaResponse> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/tareas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(tarea),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al crear la tarea"))
  return response.json()
}

export async function changeTaskStatus(
  proyectoId: number,
  tareaId: number,
  request: CambiarEstadoRequest
): Promise<TareaResponse> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/tareas/${tareaId}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al cambiar el estado de la tarea"))
  return response.json()
}

export async function deleteTask(proyectoId: number, tareaId: number): Promise<void> {
  const response = await fetch(`${API_URL}/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!response.ok) throw new Error(await parseErrorMessage(response, "Error al eliminar la tarea"))
}
