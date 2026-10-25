import { Database, KeyRound } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import type { EntitySuggestion } from "../types/copilot.types"
import { estadoTarjeta, type CopilotCardBaseProps } from "./copilot-card.types"

interface CopilotEntityCardProps extends CopilotCardBaseProps {
  entityIndex: number
  entity: EntitySuggestion
  isCreating: boolean
  onCreate: (messageId: string, entityIndex: number, entity: EntitySuggestion) => void
}

export function CopilotEntityCard({ messageId, entityIndex, entity, isCreating, onCreate, emphasis }: CopilotEntityCardProps) {
  const columnas = entity.atributos ?? []
  return (
    <ChatActionCard
      icon={Database}
      title={`Tabla ${entity.nombre}`}
      meta={<Badge variant="secondary">{columnas.length} columnas</Badge>}
      status={estadoTarjeta(entity.creada, isCreating)}
      emphasis={emphasis}
      actionLabel="Crear tabla"
      runningLabel="Creando tabla…"
      doneLabel="Tabla creada en el lienzo"
      onAction={() => onCreate(messageId, entityIndex, entity)}
    >
      {columnas.length > 0 && (
        <ul className="flex flex-col gap-0.5 font-mono text-xs text-muted-foreground">
          {columnas.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {c.esPk && <KeyRound className="size-3 text-foreground" aria-label="Clave primaria" />}
              <span className={c.esPk ? "text-foreground" : undefined}>{c.nombre}</span>
              <span>{c.tipoSql}</span>
            </li>
          ))}
        </ul>
      )}
    </ChatActionCard>
  )
}
