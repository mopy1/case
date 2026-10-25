import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import type { ChatProposal } from "../types/chat-proposal.types"
import { useChatProposalExecutor } from "../hooks/useChatProposalExecutor"
import { ChatProposalSummary } from "./chat-proposal-summary"
import { ChatProposalActionButton } from "./chat-proposal-action-button"

export interface ChatProposalCardProps {
  proposal?: ChatProposal
  propuesta?: ChatProposal
  miRol?: RolProyecto | string | null
  proyectoId?: number
  isApplied?: boolean
  isApplying?: boolean
  onApply?: () => void
}

export function ChatProposalCard({
  proposal,
  propuesta,
  miRol,
  proyectoId,
  isApplied: isAppliedProp,
  isApplying: isApplyingProp,
  onApply: onApplyProp,
}: ChatProposalCardProps) {
  const p = proposal ?? propuesta
  const pid = proyectoId ?? p?.proyectoId ?? 0
  const executor = useChatProposalExecutor(pid)

  if (!p) return null

  const isApplied = isAppliedProp ?? executor.isApplied(p.messageId)
  const isApplying = isApplyingProp ?? executor.applyingId === p.messageId
  const handleApply = onApplyProp ?? (() => void executor.aplicarPropuesta(p))

  return (
    <Card className="mt-2.5 overflow-hidden border-primary/30 bg-background/80 shadow-xs backdrop-blur-xs">
      <div className="flex items-center justify-between border-b border-border/50 bg-primary/5 px-3 py-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <Sparkles className="size-3.5" />
          <span>Propuesta de Arquitectura ({p.summary.total} cambios)</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Senior Dev · CASE Tool</span>
      </div>

      <div className="space-y-2 p-3">
        <ChatProposalSummary summary={p.summary} detalles={p.detalles} />
        <ChatProposalActionButton
          miRol={miRol}
          totalCambios={p.summary.total}
          isApplied={isApplied}
          isApplying={isApplying}
          onApply={handleApply}
        />
      </div>
    </Card>
  )
}
