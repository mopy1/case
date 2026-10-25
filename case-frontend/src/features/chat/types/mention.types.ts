import type { RolProyecto } from "@/features/projects/types/projects.type"

export interface MentionItem {
  id: string | number
  username: string
  nombreMostrar: string
  esIa: boolean
  rol?: RolProyecto | null
  email?: string
}

export interface MentionTriggerState {
  activo: boolean
  query: string
  posicionInicio: number
  posicionCursor: number
}
