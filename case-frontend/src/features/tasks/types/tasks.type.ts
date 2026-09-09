export type Prioridad = "ALTA" | "MEDIA" | "BAJA"
export type EstadoTarea = "PENDIENTE" | "EN_PROGRESO" | "HECHO"

export interface TareaRequest {
  titulo: string
  descripcion: string
  usuarioId: number | null
  prioridad: Prioridad
}

export interface TareaResponse {
  id: number
  proyectoId: number
  usuarioId: number | null
  usuarioUsername: string | null
  titulo: string
  descripcion: string
  prioridad: Prioridad
  estado: EstadoTarea
  createdAt: string
}

export interface CambiarEstadoRequest {
  estado: EstadoTarea
}
