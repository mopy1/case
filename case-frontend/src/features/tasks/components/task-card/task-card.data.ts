import type { EstadoTarea } from "../../types/tasks.type"

export const ESTADOS_ORDEN: EstadoTarea[] = ["PENDIENTE", "EN_PROGRESO", "HECHO"]

export const ESTADO_LABEL: Record<EstadoTarea, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  HECHO: "Hecho",
}
