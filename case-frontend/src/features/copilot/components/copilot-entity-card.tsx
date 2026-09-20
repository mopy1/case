import { Check, Database, KeyRound, Loader2, MapPin, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { EntitySuggestion } from "../types/copilot.types"

interface CopilotEntityCardProps {
  messageId: string
  entityIndex: number
  entity: EntitySuggestion
  isCreating: boolean
  onCreate: (messageId: string, entityIndex: number, entity: EntitySuggestion) => void
}

export function CopilotEntityCard({
  messageId,
  entityIndex,
  entity,
  isCreating,
  onCreate,
}: CopilotEntityCardProps) {
  const pk = entity.atributos?.find((a) => a.esPk)
  const columns = entity.atributos?.filter((a) => !a.esPk) ?? []

  return (
    <Card className="flex max-w-[95%] flex-col gap-2.5 rounded-xl border border-border bg-card p-3 text-xs shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Database className="size-3.5 text-primary" />
          <span>Tabla: <strong>{entity.nombre}</strong></span>
        </div>
        {entity.posX != null && entity.posY != null && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground" title="Posición calculada sin colisiones">
            <MapPin className="size-3 text-primary/70" />
            <span>({entity.posX}, {entity.posY})</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {pk && (
          <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/10 text-[10px] font-mono text-primary">
            <KeyRound className="size-2.5 text-primary" />
            {pk.nombre}: {pk.tipoSql} (PK)
          </Badge>
        )}
        {columns.map((c, i) => (
          <Badge key={i} variant="outline" className="text-[10px] font-mono text-muted-foreground">
            {c.nombre}: {c.tipoSql}
          </Badge>
        ))}
      </div>

      <div className="pt-1">
        {entity.creada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Tabla creada en el lienzo
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs hover:border-primary/40 hover:bg-primary/10"
            disabled={isCreating}
            onClick={() => onCreate(messageId, entityIndex, entity)}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Creando tabla en el lienzo...
              </>
            ) : (
              <>
                <Plus className="size-3 text-primary" />
                Crear tabla en el lienzo
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
