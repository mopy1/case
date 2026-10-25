import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { ChatProposal } from "../types/chat-proposal.types"
import { executeAllMessageChanges } from "@/features/copilot/lib/copilotBatchExecutor"
import { isProposalApplied, markProposalApplied } from "../lib/chatProposalStorage"
import { marcarPropuestaAplicada } from "../api/chatApi"

export function useChatProposalExecutor(proyectoId: number) {
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [appliedSet, setAppliedSet] = useState<Set<number>>(() => new Set())

  const isApplied = useCallback(
    (messageId: number, propuestaYaAplicada?: boolean) =>
      propuestaYaAplicada === true || appliedSet.has(messageId) || isProposalApplied(proyectoId, messageId),
    [appliedSet, proyectoId]
  )

  const aplicarPropuesta = useCallback(
    async (propuesta: ChatProposal) => {
      if (applyingId !== null || isApplied(propuesta.messageId, propuesta.propuestaAplicada)) return
      setApplyingId(propuesta.messageId)
      try {
        await executeAllMessageChanges(proyectoId, propuesta.copilotMessage)
        try {
          await marcarPropuestaAplicada(proyectoId, propuesta.messageId)
        } catch (apiErr) {
          console.warn("No se pudo sincronizar el estado remoto de la propuesta:", apiErr)
          toast.warning("Cambios aplicados, pero hubo un problema al sincronizar con el equipo")
        }
        markProposalApplied(proyectoId, propuesta.messageId)
        setAppliedSet((prev) => new Set(prev).add(propuesta.messageId))
        toast.success("Propuesta de Senior Dev aplicada con éxito en el proyecto")
      } catch (err) {
        console.error("Error al aplicar propuesta colaborativa:", err)
        toast.error("No se pudieron aplicar todos los cambios de la propuesta")
      } finally {
        setApplyingId(null)
      }
    },
    [applyingId, isApplied, proyectoId]
  )

  return {
    applyingId,
    isApplied,
    aplicarPropuesta,
  }
}
