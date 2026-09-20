import { Check, FileText, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AdrSuggestion } from "../types/copilot.types"

interface CopilotAdrCardProps {
  messageId: string
  adr: AdrSuggestion
  isSaving: boolean
  onSave: (messageId: string, adr: AdrSuggestion) => void
}

export function CopilotAdrCard({ messageId, adr, isSaving, onSave }: CopilotAdrCardProps) {
  return (
    <Card className="flex max-w-[95%] flex-col gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-foreground">
        <FileText className="size-3.5 text-primary" />
        <span>Sugerencia de Decisión Arquitectónica (ADR)</span>
      </div>
      <div className="space-y-1 text-muted-foreground">
        <div>
          <strong className="text-foreground">Acción: </strong>
          {adr.accion}
        </div>
        <div>
          <strong className="text-foreground">Motivo: </strong>
          {adr.motivo}
        </div>
      </div>

      <div className="pt-1">
        {adr.guardada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Nota guardada en el proyecto
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs hover:border-primary/40 hover:bg-primary/10"
            disabled={isSaving}
            onClick={() => onSave(messageId, adr)}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Guardando nota...
              </>
            ) : (
              "📝 Guardar como Nota ADR en el proyecto"
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
