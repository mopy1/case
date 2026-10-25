import type { MisionId } from "@/features/guia"
import type { CopilotSection } from "./copilot.types"

/** Espejo de `POST /api/proyectos/{id}/copilot/consultas` (modules/copilot/dto del backend). */
export type CopilotModo = "ASISTENTE" | "GUIA"
export type OrigenRespuesta = "DEEPSEEK" | "GEMINI" | "MANUAL"

export interface CopilotTurno {
  rol: "usuario" | "asistente"
  texto: string
}

export interface CopilotConsultaRequest {
  texto?: string
  imagenBase64?: string
  seccion?: CopilotSection
  modo?: CopilotModo
  historial?: CopilotTurno[]
  misionesPendientes?: MisionId[]
}

export interface CopilotConsultaResponse {
  texto: string
  origen: OrigenRespuesta
  herramientasUsadas: string[] | null
}
