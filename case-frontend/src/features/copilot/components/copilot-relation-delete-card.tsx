import { Unlink } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import type { RelationDeleteSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotRelationDeleteCardProps extends CopilotCardBaseProps {
  deleteIndex: number
  suggestion: RelationDeleteSuggestion
  isDeleting: boolean
  onDelete: (messageId: string, deleteIndex: number, suggestion: RelationDeleteSuggestion) => void
}

export function CopilotRelationDeleteCard({ messageId, deleteIndex, suggestion: s, isDeleting, onDelete }: CopilotRelationDeleteCardProps) {
  return (
    <ChatActionCard
      icon={Unlink}
      title={`Eliminar relación ${s.origen} – ${s.destino}`}
      tone="destructive"
      status={estadoTarjeta(s.eliminada, isDeleting)}
      actionLabel="Eliminar relación"
      runningLabel="Eliminando…"
      doneLabel="Relación eliminada del lienzo"
      onAction={() => onDelete(messageId, deleteIndex, s)}
    />
  )
}
