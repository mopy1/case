import { CheckCheck, Loader2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CopilotMessage } from "../types/copilot.types"
import { countPendingActions, hasAnyActions } from "../lib/copilotPendingActions"

interface CopilotApplyAllButtonProps {
  message: CopilotMessage
  isApplyingAll: boolean
  onApplyAll: (message: CopilotMessage) => void
}

export function CopilotApplyAllButton({
  message,
  isApplyingAll,
  onApplyAll,
}: CopilotApplyAllButtonProps) {
  const pending = countPendingActions(message)
  const hasActions = hasAnyActions(message)

  if (!hasActions) return null

  if (pending === 0) {
    return (
      <Badge
        variant="outline"
        className="w-fit gap-1 border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
      >
        <CheckCheck className="size-3" />
        ✓ Todos los cambios aplicados
      </Badge>
    )
  }

  if (pending < 2) return null

  return (
    <Button
      size="sm"
      variant="default"
      disabled={isApplyingAll}
      onClick={() => onApplyAll(message)}
      className="h-auto min-h-8 max-w-full w-fit gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 whitespace-normal text-left"
    >
      {isApplyingAll ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          <span>Aplicando {pending} cambios...</span>
        </>
      ) : (
        <>
          <Zap className="size-3.5 fill-current" />
          <span>⚡ Aplicar todos los cambios ({pending})</span>
        </>
      )}
    </Button>
  )
}
