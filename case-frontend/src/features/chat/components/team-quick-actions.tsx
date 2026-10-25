import { useState } from "react"
import { ChatQuickActions } from "@/components/chat"
import { DdlViewerDialog } from "@/features/generator"
import { CHAT_QUICK_ACTIONS } from "../lib/chatQuickActions.data"

interface TeamQuickActionsProps {
  proyectoId: number
  /** Inserta el prompt en el composer para editarlo antes de enviar (D2: nunca envía solo). */
  onInsertar: (texto: string) => void
  disabled?: boolean
}

/** Fila de acciones rápidas del Equipo: prompts a Senior Dev y "Ver DDL" local (no escribe en la sala). */
export function TeamQuickActions({ proyectoId, onInsertar, disabled }: TeamQuickActionsProps) {
  const [ddlAbierto, setDdlAbierto] = useState(false)

  return (
    <>
      <ChatQuickActions
        actions={CHAT_QUICK_ACTIONS}
        ariaLabel="Acciones rápidas para Senior Dev"
        disabled={disabled}
        onSelect={(accion) => {
          const def = CHAT_QUICK_ACTIONS.find((a) => a.id === accion.id)
          if (def?.prompt) onInsertar(def.prompt)
          else setDdlAbierto(true)
        }}
      />
      <DdlViewerDialog open={ddlAbierto} onOpenChange={setDdlAbierto} proyectoId={proyectoId} />
    </>
  )
}
