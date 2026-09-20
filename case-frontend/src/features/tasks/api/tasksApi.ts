import { apiFetch } from "@/lib/api"
import type { CambiarEstadoRequest, TareaRequest, TareaResponse } from "../types/tasks.type"

export function getTasks(proyectoId: number): Promise<TareaResponse[]> {
  return apiFetch(`/api/proyectos/${proyectoId}/tareas`, { errorFallback: "Error al obtener las tareas" })
}

export function createTask(proyectoId: number, tarea: TareaRequest): Promise<TareaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/tareas`, {
    method: "POST",
    body: JSON.stringify(tarea),
    errorFallback: "Error al crear la tarea",
  })
}

export function changeTaskStatus(
  proyectoId: number,
  tareaId: number,
  request: CambiarEstadoRequest
): Promise<TareaResponse> {
  return apiFetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}/estado`, {
    method: "PATCH",
    body: JSON.stringify(request),
    errorFallback: "Error al cambiar el estado de la tarea",
  })
}

export function deleteTask(proyectoId: number, tareaId: number): Promise<void> {
  return apiFetch(`/api/proyectos/${proyectoId}/tareas/${tareaId}`, {
    method: "DELETE",
    errorFallback: "Error al eliminar la tarea",
  })
}
