import { Check, Loader2, Unlink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { RelationDeleteSuggestion } from "../types/copilot.types"

interface CopilotRelationDeleteCardProps {
  messageId: string
  deleteIndex: number
  suggestion: RelationDeleteSuggestion
  isDeleting: boolean
  onDelete: (messageId: string, deleteIndex: number, suggestion: RelationDeleteSuggestion) => void
}

export function CopilotRelationDeleteCard({
  messageId,
  deleteIndex,
  suggestion,
  isDeleting,
  onDelete,
}: CopilotRelationDeleteCardProps) {
  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 sm:p-3 text-xs shadow-xs dark:bg-destructive/10 overflow-hidden">
      <div className="flex items-center gap-1.5 font-semibold text-destructive dark:text-red-400">
        <Unlink className="size-3.5 shrink-0" />
        <span>Eliminar relación en el lienzo</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-foreground">{suggestion.origen}</span>
        <span className="text-muted-foreground font-mono">⇸</span>
        <span className="font-semibold text-foreground">{suggestion.destino}</span>
      </div>

      <div className="pt-1">
        {suggestion.eliminada ? (
          <Badge variant="outline" className="gap-1 border-muted-foreground/30 bg-muted/40 text-[11px] text-muted-foreground">
            <Check className="size-3" />
            ✓ Relación eliminada del lienzo
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="destructive"
            className="h-auto min-h-7 py-1 px-2.5 gap-1.5 text-xs whitespace-normal text-left opacity-90 hover:opacity-100"
            disabled={isDeleting}
            onClick={() => onDelete(messageId, deleteIndex, suggestion)}
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Eliminando relación...
              </>
            ) : (
              <>
                <Unlink className="size-3" />
                Eliminar relación {suggestion.origen} ↔ {suggestion.destino}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
