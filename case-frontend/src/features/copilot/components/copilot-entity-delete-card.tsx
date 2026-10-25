import { Trash2 } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import type { EntityDeleteSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotEntityDeleteCardProps extends CopilotCardBaseProps {
  deleteIndex: number
  suggestion: EntityDeleteSuggestion
  isDeleting: boolean
  onDelete: (messageId: string, deleteIndex: number, suggestion: EntityDeleteSuggestion) => void
}

export function CopilotEntityDeleteCard({ messageId, deleteIndex, suggestion, isDeleting, onDelete }: CopilotEntityDeleteCardProps) {
  return (
    <ChatActionCard
      icon={Trash2}
      title={`Eliminar tabla ${suggestion.tabla}`}
      tone="destructive"
      status={estadoTarjeta(suggestion.eliminada, isDeleting)}
      actionLabel="Eliminar tabla"
      runningLabel="Eliminando…"
      doneLabel="Tabla eliminada del lienzo"
      onAction={() => onDelete(messageId, deleteIndex, suggestion)}
    />
  )
}
