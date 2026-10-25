import { PlusCircle } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import type { AttributeSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotAttributeCardProps extends CopilotCardBaseProps {
  attributeIndex: number
  attribute: AttributeSuggestion
  isCreating: boolean
  onCreate: (messageId: string, attributeIndex: number, attribute: AttributeSuggestion) => void
}

export function CopilotAttributeCard({ messageId, attributeIndex, attribute: a, isCreating, onCreate, emphasis }: CopilotAttributeCardProps) {
  return (
    <ChatActionCard
      icon={PlusCircle}
      title={`Atributo en ${a.tabla}`}
      meta={<Badge variant="secondary">{a.tipoSql}</Badge>}
      status={estadoTarjeta(a.creada, isCreating)}
      emphasis={emphasis}
      actionLabel="Agregar atributo"
      runningLabel="Agregando…"
      doneLabel={`Atributo agregado a ${a.tabla}`}
      onAction={() => onCreate(messageId, attributeIndex, a)}
    >
      <p className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
        {a.nombre}
        {a.esPk && <Badge variant="outline">PK</Badge>}
        {!a.nullable && !a.esPk && <Badge variant="outline">NOT NULL</Badge>}
      </p>
    </ChatActionCard>
  )
}
