import { CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { CopilotMessage } from "../types/copilot.types"
import { countPendingActions, hasAnyActions } from "../lib/copilotPendingActions"

interface CopilotApplyAllButtonProps {
  message: CopilotMessage
  isApplyingAll: boolean
  onApplyAll: (message: CopilotMessage) => void
}

/** Barra "N cambios sugeridos · Aplicar todos": la acción primaria cuando hay 2 o más pendientes. */
export function CopilotApplyAllButton({ message, isApplyingAll, onApplyAll }: CopilotApplyAllButtonProps) {
  const pending = countPendingActions(message)
  if (!hasAnyActions(message)) return null

  if (pending === 0) {
    return (
      <p className="flex items-center gap-1.5 px-1 text-sm text-success">
        <CheckCheck className="size-4" /> Todos los cambios aplicados
      </p>
    )
  }
  if (pending < 2) return null

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
      <span className="text-sm">{pending} cambios sugeridos</span>
      <Button size="sm" disabled={isApplyingAll} onClick={() => onApplyAll(message)}>
        {isApplyingAll && <Spinner data-icon="inline-start" />}
        {isApplyingAll ? "Aplicando…" : "Aplicar todos"}
      </Button>
    </div>
  )
}
