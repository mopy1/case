import type { LucideIcon } from "lucide-react"

export type ChatAuthorKind = "human" | "agent" | "system"

export interface ChatAuthor {
  id: string | number
  name: string
  /** Rol ya traducido ("Colaborador"). */
  role?: string
  kind: ChatAuthorKind
}

/** own = mensaje propio · peer = otra persona · agent = IA · system = aviso del sistema. */
export type ChatMessageVariant = "own" | "peer" | "agent" | "system"

export type ActionStatus = "idle" | "running" | "done" | "locked" | "error"

export interface QuickAction {
  id: string
  label: string
  icon?: LucideIcon
  disabled?: boolean
  tooltip?: string
}

export interface AgentStep {
  id: string
  label: string
  state: "pending" | "active" | "done" | "error"
}

export interface ChatActionButton {
  label: string
  onClick: () => void
  loading?: boolean
}
