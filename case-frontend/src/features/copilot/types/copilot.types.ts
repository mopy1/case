import type { LadoMultiplicidad, TipoRelacionUml } from "@/features/diagram/types/diagram.types"
import type { Prioridad } from "@/features/tasks/types/tasks.type"
import type { GuiaPasoId } from "@/features/guia"

export type CopilotSection = "diagrama" | "tareas" | "notas" | "xmi" | "generador" | "general"

export interface AdrSuggestion {
  accion: string
  motivo: string
  guardada?: boolean
}

export interface EntityAttributeSuggestion {
  nombre: string
  tipoSql: string
  esPk: boolean
  esFk?: boolean
  nullable?: boolean
}

export interface EntitySuggestion {
  nombre: string
  posX?: number
  posY?: number
  atributos?: EntityAttributeSuggestion[]
  creada?: boolean
}

export interface RelationSuggestion {
  origen: string
  destino: string
  multiplicidadOrigen: LadoMultiplicidad
  multiplicidadDestino: LadoMultiplicidad
  tipo?: TipoRelacionUml
  creada?: boolean
}

export interface RelationDeleteSuggestion {
  origen: string
  destino: string
  eliminada?: boolean
}

export interface AttributeSuggestion {
  tabla: string
  nombre: string
  tipoSql: string
  esPk?: boolean
  esFk?: boolean
  nullable?: boolean
  creada?: boolean
}

export interface EntityDeleteSuggestion {
  tabla: string
  eliminada?: boolean
}

export interface TaskSuggestion {
  titulo: string
  descripcion: string
  prioridad?: Prioridad
  creada?: boolean
}

export interface SystemActionSuggestion {
  tipo: "EXPORTAR_XMI" | "GENERAR_BACKEND" | "NAVEGAR"
  label: string
  destino?: CopilotSection
  ejecutada?: boolean
}

export interface CopilotMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  /** ISO-8601; se muestra con `horaCorta`. */
  timestamp: string
  adrSuggestion?: AdrSuggestion
  adrSuggestions?: AdrSuggestion[]
  entitySuggestions?: EntitySuggestion[]
  relationSuggestions?: RelationSuggestion[]
  relationDeleteSuggestions?: RelationDeleteSuggestion[]
  attributeSuggestions?: AttributeSuggestion[]
  entityDeleteSuggestions?: EntityDeleteSuggestion[]
  taskSuggestions?: TaskSuggestion[]
  systemActions?: SystemActionSuggestion[]
  section?: CopilotSection
  imageUrl?: string
}

/** Mensaje del modo Guía (historial en memoria, separado del Asistente). */
export interface GuiaMensaje {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  pasos?: GuiaPasoId[]
  irA?: CopilotSection
  fuentes?: string[]
  error?: boolean
}
