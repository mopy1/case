import { CheckCheck, Loader2, Lock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { evaluarPermisosPropuesta } from "../types/chat-proposal.types"

interface ChatProposalActionButtonProps {
  miRol?: RolProyecto | string | null
  totalCambios: number
  isApplied: boolean
  isApplying: boolean
  onApply: () => void
}

export function ChatProposalActionButton({
  miRol,
  totalCambios,
  isApplied,
  isApplying,
  onApply,
}: ChatProposalActionButtonProps) {
  if (isApplied) {
    return (
      <Badge
        variant="outline"
        className="w-full justify-center gap-1 border-emerald-500/40 bg-emerald-500/10 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
      >
        <CheckCheck className="size-3.5" />
        <span>✓ Cambios aplicados en el proyecto</span>
      </Badge>
    )
  }

  const { puedeAplicar, motivoBloqueo } = evaluarPermisosPropuesta(miRol)

  return (
    <div className="space-y-1.5">
      <Button
        size="sm"
        disabled={!puedeAplicar || isApplying}
        onClick={onApply}
        className="h-8 w-full gap-1.5 rounded-md bg-primary text-xs font-semibold shadow-xs hover:bg-primary/90 disabled:opacity-60"
      >
        {isApplying ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>Aplicando {totalCambios} cambios...</span>
          </>
        ) : (
          <>
            <Zap className="size-3.5 fill-current" />
            <span>⚡ Aplicar cambios en el proyecto ({totalCambios})</span>
          </>
        )}
      </Button>

      {!puedeAplicar && (
        <p className="flex items-center justify-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
          <Lock className="size-2.5" />
          <span>{motivoBloqueo}</span>
        </p>
      )}
    </div>
  )
}
