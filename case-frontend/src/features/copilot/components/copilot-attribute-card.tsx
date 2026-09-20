import { Check, Loader2, PlusCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AttributeSuggestion } from "../types/copilot.types"

interface CopilotAttributeCardProps {
  messageId: string
  attributeIndex: number
  attribute: AttributeSuggestion
  isCreating: boolean
  onCreate: (messageId: string, attributeIndex: number, attribute: AttributeSuggestion) => void
}

export function CopilotAttributeCard({
  messageId,
  attributeIndex,
  attribute,
  isCreating,
  onCreate,
}: CopilotAttributeCardProps) {
  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-border bg-card p-2.5 sm:p-3 text-xs shadow-xs overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <PlusCircle className="size-3.5 text-primary" />
          <span>Atributo para <strong className="font-semibold">{attribute.tabla}</strong></span>
        </div>
        <Badge variant="outline" className="font-mono text-[10px]">
          {attribute.tipoSql}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground font-semibold">
          {attribute.nombre}
        </code>
        {attribute.esPk && (
          <Badge variant="secondary" className="px-1 py-0 text-[10px] text-amber-600 dark:text-amber-400">
            PK
          </Badge>
        )}
        {!attribute.nullable && !attribute.esPk && (
          <Badge variant="secondary" className="px-1 py-0 text-[10px] text-blue-600 dark:text-blue-400">
            NOT NULL
          </Badge>
        )}
      </div>

      <div className="pt-1">
        {attribute.creada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Atributo agregado a {attribute.tabla}
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-auto min-h-7 py-1 px-2.5 gap-1.5 text-xs whitespace-normal text-left hover:border-primary/40 hover:bg-primary/10"
            disabled={isCreating}
            onClick={() => onCreate(messageId, attributeIndex, attribute)}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Agregando atributo...
              </>
            ) : (
              <>
                <PlusCircle className="size-3 text-primary" />
                Agregar atributo a {attribute.tabla}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
