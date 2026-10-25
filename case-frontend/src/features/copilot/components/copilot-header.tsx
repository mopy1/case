import { RotateCcw, Zap } from "lucide-react"
import { ChatAvatar, ChatHeader } from "@/components/chat"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { CopilotSection } from "../types/copilot.types"

const SECTION_LABELS: Record<CopilotSection, string> = {
  diagrama: "Diagrama",
  tareas: "Tareas",
  notas: "Notas",
  xmi: "XMI",
  generador: "Generador",
  general: "General",
}

interface CopilotHeaderProps {
  section: CopilotSection
  autoMode: boolean
  onToggleAutoMode: () => void
  onClear: () => void
  canClear: boolean
}

/** Cabecera del Copilot: quién lo ve, modo autónomo (con aviso) y reinicio con confirmación. */
export function CopilotHeader({ section, autoMode, onToggleAutoMode, onClear, canClear }: CopilotHeaderProps) {
  return (
    <ChatHeader
      title="Copilot"
      description={`Solo vos lo ves · ${SECTION_LABELS[section]}`}
      leading={<ChatAvatar author={{ id: "copilot", name: "Copilot", kind: "agent" }} />}
      actions={
        <>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={autoMode}
                  onClick={onToggleAutoMode}
                  className={cn(autoMode && "border-warning/40 bg-warning/10 text-warning hover:bg-warning/15 hover:text-warning")}
                />
              }
            >
              <Zap data-icon="inline-start" /> Autónomo
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56 text-center">
              {autoMode ? "Desactivar: volver a confirmar cada cambio" : "Aplicar las sugerencias en el proyecto sin pedir confirmación"}
            </TooltipContent>
          </Tooltip>
          <ConfirmDialog
            title="¿Reiniciar la conversación?"
            description="Se borran los mensajes de esta conversación con el Copilot. Los cambios ya aplicados al proyecto se mantienen."
            confirmLabel="Reiniciar"
            onConfirm={onClear}
            trigger={<Button variant="ghost" size="icon-sm" aria-label="Reiniciar conversación" disabled={!canClear} />}
          >
            <RotateCcw />
          </ConfirmDialog>
        </>
      }
      banner={
        autoMode && (
          <Marker className="text-xs">
            <MarkerIcon className="text-warning">
              <Zap />
            </MarkerIcon>
            <MarkerContent className="flex-1">Modo autónomo: los cambios se aplican sin pedir confirmación.</MarkerContent>
            <Button variant="ghost" size="xs" onClick={onToggleAutoMode}>
              Desactivar
            </Button>
          </Marker>
        )
      }
    />
  )
}
