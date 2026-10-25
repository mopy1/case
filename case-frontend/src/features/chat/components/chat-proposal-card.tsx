import type { ReactNode } from "react"
import { Layers } from "lucide-react"
import { ChatActionCard } from "@/components/chat"
import type { ActionStatus } from "@/components/chat"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import type { RolProyecto } from "@/features/projects/types/projects.type"
import { evaluarPermisosPropuesta } from "../types/chat-proposal.types"
import type { ChatProposal } from "../types/chat-proposal.types"
import { useChatProposalExecutor } from "../hooks/useChatProposalExecutor"
import { ChatProposalSummary } from "./chat-proposal-summary"

interface ChatProposalCardProps {
  proposal: ChatProposal
  miRol?: RolProyecto | null
  proyectoId: number
  /** Estado aplicado que llega del backend por REST/WS. */
  isApplied?: boolean
  aplicadoPor?: string | null
  /** F4: acciones secundarias del pie ("Ver DDL del modelo"). */
  secondary?: ReactNode
}

/** Propuesta del Senior Dev: única acción primaria del mensaje, con RBAC y estado sincronizado. */
export function ChatProposalCard({ proposal: p, miRol, proyectoId, isApplied, aplicadoPor, secondary }: ChatProposalCardProps) {
  const { user } = useAuth()
  const executor = useChatProposalExecutor(proyectoId)
  const { puedeAplicar, motivoBloqueo } = evaluarPermisosPropuesta(miRol)
  const total = p.summary.total
  const aplicado = Boolean(isApplied) || executor.isApplied(p.messageId, p.propuestaAplicada)
  const autor = aplicadoPor ?? p.aplicadoPor
  const esPropio = Boolean(user?.username && autor && user.username.toLowerCase() === autor.toLowerCase())

  let status: ActionStatus = "idle"
  if (aplicado) status = "done"
  else if (executor.applyingId === p.messageId) status = "running"
  else if (!puedeAplicar) status = "locked"

  return (
    <ChatActionCard
      icon={Layers}
      title="Propuesta de cambios"
      meta={<Badge variant="secondary">{total === 1 ? "1 cambio" : `${total} cambios`}</Badge>}
      status={status}
      emphasis="primary"
      actionLabel={total === 1 ? "Aplicar 1 cambio" : `Aplicar ${total} cambios`}
      runningLabel="Aplicando…"
      doneLabel={esPropio ? "Aplicado por vos" : autor ? `Aplicado por @${autor}` : "Cambios aplicados"}
      lockedReason={motivoBloqueo}
      onAction={() => void executor.aplicarPropuesta(p)}
      secondary={secondary}
      size="default"
    >
      <ChatProposalSummary summary={p.summary} detalles={p.detalles} />
    </ChatActionCard>
  )
}
