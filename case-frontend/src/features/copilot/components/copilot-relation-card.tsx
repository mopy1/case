import { ArrowRight, Link2 } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import type { RelationSuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotRelationCardProps extends CopilotCardBaseProps {
  relationIndex: number
  relation: RelationSuggestion
  isCreating: boolean
  onCreate: (messageId: string, relationIndex: number, relation: RelationSuggestion) => void
}

const MULTIPLICIDAD: Record<string, string> = { UNO: "1", CERO_O_UNO: "0..1", UNO_O_MAS: "1..*", CERO_O_MAS: "0..*" }
const TIPO: Record<string, string> = { COMPOSICION: "Composición", AGREGACION: "Agregación", HERENCIA: "Herencia" }

export function CopilotRelationCard({ messageId, relationIndex, relation: r, isCreating, onCreate, emphasis }: CopilotRelationCardProps) {
  return (
    <ChatActionCard
      icon={Link2}
      title="Relación"
      meta={r.tipo && TIPO[r.tipo] ? <Badge variant="secondary">{TIPO[r.tipo]}</Badge> : undefined}
      status={estadoTarjeta(r.creada, isCreating)}
      emphasis={emphasis}
      actionLabel="Conectar en el lienzo"
      runningLabel="Conectando…"
      doneLabel="Relación aplicada en el lienzo"
      onAction={() => onCreate(messageId, relationIndex, r)}
    >
      <p className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="font-medium">{r.origen}</span>
        <span className="font-mono text-xs text-muted-foreground">{MULTIPLICIDAD[r.multiplicidadOrigen] ?? r.multiplicidadOrigen}</span>
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
        <span className="font-mono text-xs text-muted-foreground">{MULTIPLICIDAD[r.multiplicidadDestino] ?? r.multiplicidadDestino}</span>
        <span className="font-medium">{r.destino}</span>
      </p>
    </ChatActionCard>
  )
}
