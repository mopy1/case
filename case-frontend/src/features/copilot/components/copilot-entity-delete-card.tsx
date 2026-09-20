import { Check, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { EntityDeleteSuggestion } from "../types/copilot.types"

interface CopilotEntityDeleteCardProps {
  messageId: string
  deleteIndex: number
  suggestion: EntityDeleteSuggestion
  isDeleting: boolean
  onDelete: (messageId: string, deleteIndex: number, suggestion: EntityDeleteSuggestion) => void
}

export function CopilotEntityDeleteCard({
  messageId,
  deleteIndex,
  suggestion,
  isDeleting,
  onDelete,
}: CopilotEntityDeleteCardProps) {
  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-2.5 sm:p-3 text-xs shadow-xs dark:bg-destructive/10 overflow-hidden">
      <div className="flex items-center gap-1.5 font-semibold text-destructive dark:text-red-400">
        <Trash2 className="size-3.5 shrink-0" />
        <span>Eliminar tabla duplicada o innecesaria</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Tabla a remover:</span>
        <code className="rounded bg-background px-1.5 py-0.5 font-mono font-semibold text-foreground border border-border">
          {suggestion.tabla}
        </code>
      </div>

      <div className="pt-1">
        {suggestion.eliminada ? (
          <Badge variant="outline" className="gap-1 border-muted-foreground/30 bg-muted/40 text-[11px] text-muted-foreground">
            <Check className="size-3" />
            ✓ Tabla eliminada del lienzo
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
                Eliminando tabla...
              </>
            ) : (
              <>
                <Trash2 className="size-3" />
                Eliminar tabla "{suggestion.tabla}"
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
