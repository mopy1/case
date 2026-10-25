import type { ReactNode } from "react"
import { RotateCcw } from "lucide-react"
import { ChatAvatar, ChatHeader } from "@/components/chat"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import type { CopilotSection } from "../../types/copilot.types"
import { SECTION_LABELS } from "../../lib/copilotSection"

interface GuiaHeaderProps {
  section: CopilotSection
  modeSwitch: ReactNode
  onClear: () => void
  canClear: boolean
}

/** Cabecera de la Guía: sin modo autónomo; reiniciar no toca el progreso de "Primeros pasos". */
export function GuiaHeader({ section, modeSwitch, onClear, canClear }: GuiaHeaderProps) {
  return (
    <ChatHeader
      title="Guía"
      description={`Solo vos lo ves · ${SECTION_LABELS[section]}`}
      leading={<ChatAvatar author={{ id: "guia", name: "Guía", kind: "agent" }} />}
      actions={
        <>
          {modeSwitch}
          <ConfirmDialog
            title="¿Reiniciar la conversación con la Guía?"
            description="Se borran los mensajes con la Guía. Tu progreso de Primeros pasos se mantiene."
            confirmLabel="Reiniciar"
            onConfirm={onClear}
            trigger={<Button variant="ghost" size="icon-sm" aria-label="Reiniciar conversación con la Guía" disabled={!canClear} />}
          >
            <RotateCcw />
          </ConfirmDialog>
        </>
      }
    />
  )
}
