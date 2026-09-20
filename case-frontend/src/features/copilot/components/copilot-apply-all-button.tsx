import { CheckCheck, Loader2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { CopilotMessage } from "../types/copilot.types"

interface CopilotApplyAllButtonProps {
  message: CopilotMessage
  isApplyingAll: boolean
  onApplyAll: (message: CopilotMessage) => void
}

export function countPendingActions(message: CopilotMessage): number {
  let count = 0
  if (message.entityDeleteSuggestions) {
    count += message.entityDeleteSuggestions.filter((d) => !d.eliminada).length
  }
  if (message.entitySuggestions) {
    count += message.entitySuggestions.filter((e) => !e.creada).length
  }
  if (message.attributeSuggestions) {
    count += message.attributeSuggestions.filter((a) => !a.creada).length
  }
  if (message.relationSuggestions) {
    count += message.relationSuggestions.filter((r) => !r.creada).length
  }
  if (message.adrSuggestions) {
    count += message.adrSuggestions.filter((a) => !a.guardada).length
  } else if (message.adrSuggestion && !message.adrSuggestion.guardada) {
    count += 1
  }
  return count
}

export function hasAnyActions(message: CopilotMessage): boolean {
  return !!(
    (message.entityDeleteSuggestions && message.entityDeleteSuggestions.length > 0) ||
    (message.entitySuggestions && message.entitySuggestions.length > 0) ||
    (message.attributeSuggestions && message.attributeSuggestions.length > 0) ||
    (message.relationSuggestions && message.relationSuggestions.length > 0) ||
    (message.adrSuggestions && message.adrSuggestions.length > 0) ||
    message.adrSuggestion
  )
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
      className="h-8 w-fit gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
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
