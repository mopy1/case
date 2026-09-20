export type CopilotSection = "diagrama" | "tareas" | "notas" | "xmi" | "generador" | "general"

export interface AdrSuggestion {
  accion: string
  motivo: string
  guardada?: boolean
}

export interface CopilotMessage {
  id: string
  sender: "user" | "assistant"
  text: string
  timestamp: string
  adrSuggestion?: AdrSuggestion
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
