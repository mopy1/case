import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { CopilotMessage } from "@/features/copilot/types/copilot.types"

/** Resumen cuantitativo de cambios detectados en la propuesta de Senior Dev. */
export interface ChatProposalSummary {
  tablasNuevas: number
  tablasEliminadas: number
  atributosNuevos: number
  relacionesNuevas: number
  relacionesEliminadas: number
  tareasNuevas: number
  adrsNuevas: number
  accionesSistema: number
  total: number
}

/** Entidad de propuesta procesada a partir de un ChatMensaje de tipo IA. */
export interface ChatProposal {
  messageId: number
  proyectoId: number
  textoLimpio: string
  summary: ChatProposalSummary
  totalCambios: number
  detalles: string[]
  copilotMessage: CopilotMessage
  propuestaAplicada?: boolean
  aplicadoPor?: string | null
  /** F4: la IA emitió `GENERAR_DDL` → la tarjeta ofrece el visor del DDL generado desde el diagrama. */
  pideDdl: boolean
}

/** Estado de ciclo de vida de la propuesta en la sesión del usuario. */
export type EstadoPropuesta = "PENDIENTE" | "APLICANDO" | "APLICADA" | "ERROR"

/** Permisos calculados para interacción con la propuesta. */
export interface PermisosPropuesta {
  puedeAplicar: boolean
  motivoBloqueo?: string
}

export function evaluarPermisosPropuesta(rol?: RolProyecto | string | null): PermisosPropuesta {
  if (rol === "ADMIN" || rol === "COLABORADOR") {
    return { puedeAplicar: true }
  }
  return {
    puedeAplicar: false,
    motivoBloqueo: "Solo ADMIN y COLABORADOR pueden aplicar cambios al proyecto.",
  }
}
