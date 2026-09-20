import type { LadoMultiplicidad } from "@/features/diagram/types/diagram.types"

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

export interface CopilotMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  adrSuggestion?: AdrSuggestion
  entitySuggestions?: EntitySuggestion[]
  relationSuggestions?: RelationSuggestion[]
  section?: CopilotSection
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
