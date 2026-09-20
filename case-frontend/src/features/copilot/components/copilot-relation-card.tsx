import { ArrowRight, Check, GitCommit, Link2, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { RelationSuggestion } from "../types/copilot.types"

interface CopilotRelationCardProps {
  messageId: string
  relationIndex: number
  relation: RelationSuggestion
  isCreating: boolean
  onCreate: (messageId: string, relationIndex: number, relation: RelationSuggestion) => void
}

function formatMultiplicidad(m: string): string {
  if (m === "UNO") return "1"
  if (m === "CERO_O_UNO") return "0..1"
  if (m === "UNO_O_MAS") return "1..*"
  if (m === "CERO_O_MAS") return "0..*"
  return m
}

export function CopilotRelationCard({
  messageId,
  relationIndex,
  relation,
  isCreating,
  onCreate,
}: CopilotRelationCardProps) {
  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:p-3 text-xs shadow-xs overflow-hidden">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <Link2 className="size-3.5 text-primary" />
        <span>Relación UML</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="font-semibold text-foreground">{relation.origen}</span>
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
          ({formatMultiplicidad(relation.multiplicidadOrigen)})
        </Badge>
        <ArrowRight className="size-3 text-muted-foreground" />
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-mono">
          ({formatMultiplicidad(relation.multiplicidadDestino)})
        </Badge>
        <span className="font-semibold text-foreground">{relation.destino}</span>
      </div>

      <div className="pt-1">
        {relation.creada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Relación aplicada en el lienzo
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-7 py-1 px-2.5 gap-1.5 text-xs whitespace-normal text-left hover:border-primary/40 hover:bg-primary/10"
            disabled={isCreating}
            onClick={() => onCreate(messageId, relationIndex, relation)}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Aplicando relación en el lienzo...
              </>
            ) : (
              <>
                <GitCommit className="size-3 text-primary" />
                Conectar / Actualizar en el lienzo
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
