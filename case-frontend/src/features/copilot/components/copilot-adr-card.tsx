import { FileText } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import type { AdrSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotAdrCardProps extends CopilotCardBaseProps {
  adr: AdrSuggestion
  isSaving: boolean
  onSave: (messageId: string, adr: AdrSuggestion) => void
}

export function CopilotAdrCard({ messageId, adr, isSaving, onSave, emphasis }: CopilotAdrCardProps) {
  return (
    <ChatActionCard
      icon={FileText}
      title="Decisión de arquitectura (ADR)"
      status={estadoTarjeta(adr.guardada, isSaving)}
      emphasis={emphasis}
      actionLabel="Guardar como nota ADR"
      runningLabel="Guardando…"
      doneLabel="Nota guardada en el proyecto"
      onAction={() => onSave(messageId, adr)}
    >
      <p className="font-medium">{adr.accion}</p>
      <p className="text-muted-foreground">{adr.motivo}</p>
    </ChatActionCard>
  )
}
