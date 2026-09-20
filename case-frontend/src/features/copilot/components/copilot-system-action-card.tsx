import { ArrowUpRight, Check, Download, FileCode, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { SystemActionSuggestion } from "../types/copilot.types"

interface CopilotSystemActionCardProps {
  messageId: string
  actionIndex: number
  action: SystemActionSuggestion
  isExecuting: boolean
  onExecute: (messageId: string, actionIndex: number, action: SystemActionSuggestion) => void
}

export function CopilotSystemActionCard({
  messageId,
  actionIndex,
  action,
  isExecuting,
  onExecute,
}: CopilotSystemActionCardProps) {
  const isXmi = action.tipo === "EXPORTAR_XMI"
  const isBackend = action.tipo === "GENERAR_BACKEND"

  return (
    <Card className="flex w-full max-w-full flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5 sm:p-3 text-xs shadow-xs dark:bg-primary/10 overflow-hidden">
      <div className="flex items-center gap-1.5 font-semibold text-primary">
        {isBackend ? (
          <FileCode className="size-3.5 shrink-0" />
        ) : isXmi ? (
          <Download className="size-3.5 shrink-0" />
        ) : (
          <ArrowUpRight className="size-3.5 shrink-0" />
        )}
        <span>Acción del Sistema</span>
      </div>

      <p className="text-xs text-foreground font-medium break-words">{action.label}</p>

      <div className="pt-1">
        {action.ejecutada ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">
            <Check className="size-3" />
            ✓ Acción ejecutada
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="default"
            className="h-auto min-h-7 py-1 px-2.5 gap-1.5 text-xs whitespace-normal text-left bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isExecuting}
            onClick={() => onExecute(messageId, actionIndex, action)}
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                {isBackend ? <FileCode className="size-3" /> : <Download className="size-3" />}
                {action.label}
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  )
}
