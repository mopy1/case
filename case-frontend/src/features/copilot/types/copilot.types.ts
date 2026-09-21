import type { LadoMultiplicidad } from "@/features/diagram/types/diagram.types"
import type { Prioridad } from "@/features/tasks/types/tasks.type"

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

export interface KnowledgeTopic {
  id: string
  title: string
  section: CopilotSection
  summary: string
  content: string
  keywords: string[]
  sampleQuestions: string[]
  suggestedAdr?: {
    accion: string
    motivo: string
  }
}
