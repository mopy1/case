import { useEffect } from "react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"
import { useCopilot } from "../hooks/useCopilot"
import { usePanelResize } from "../hooks/usePanelResize"
import { CopilotHeader } from "./copilot-header"
import { CopilotInput } from "./copilot-input"
import { CopilotMessageList } from "./copilot-message-list"
import { CopilotQuickSuggestions } from "./copilot-quick-suggestions"

interface CopilotPanelProps {
  proyectoId: number
  isOpen: boolean
  onClose: () => void
}

export function CopilotPanel({ proyectoId, isOpen, onClose }: CopilotPanelProps) {
  const copilot = useCopilot(proyectoId)
  const isMobile = useIsMobile()
  const { width, isDragging, setIsDragging, resetWidth } = usePanelResize()
  const { sendMessage } = copilot

  // Texto dictado con Push-to-Talk (ver `ProjectLayout`) — depende de `sendMessage` (memoizada con
  // useCallback) y no del objeto `copilot` entero, que es nuevo en cada render.
  useEffect(() => {
    const onVoiceSubmit = (e: Event) => {
      const custom = e as CustomEvent<{ text: string }>
      if (custom.detail?.text) {
        sendMessage(custom.detail.text)
      }
    }
    window.addEventListener("copilot:voice-submit", onVoiceSubmit)
    return () => window.removeEventListener("copilot:voice-submit", onVoiceSubmit)
  }, [sendMessage])

  return (
    <>
      {/* Backdrop oscuro con blur en móviles cuando el drawer está abierto */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Panel Asistente IA y Manual CASE"
        style={
          isMobile
            ? { height: "var(--visual-viewport-height, 100dvh)", maxHeight: "var(--visual-viewport-height, 100dvh)" }
            : { width: isOpen ? `${width}px` : 0 }
        }
        className={cn(
          "bg-card border-border",
          // Móvil: Drawer flotante adaptativo al teclado virtual que no empuja el layout
          "fixed top-0 right-0 z-50 flex flex-col w-full sm:max-w-[380px] shadow-2xl transition-transform duration-200 ease-out overscroll-contain",
          isOpen ? "translate-x-0 border-l" : "translate-x-full pointer-events-none invisible",
          // Escritorio: Panel acoplado redimensionable
          "md:relative md:top-auto md:right-auto md:inset-auto md:z-auto md:w-auto md:shadow-xl md:translate-x-0 md:visible md:h-full md:shrink-0",
          isDragging ? "md:select-none" : "md:transition-[width,opacity] md:duration-200 md:ease-out",
          isOpen
            ? "md:border-l md:opacity-100 md:pointer-events-auto"
            : "md:border-l-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
        )}
      >
        {/* Resize handle exclusivo para pantallas de escritorio */}
        {!isMobile && isOpen && (
          <div
            role="separator"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDoubleClick={resetWidth}
            title="Arrastra para redimensionar el panel (Doble clic para restablecer)"
            className="group absolute -left-1.5 top-0 bottom-0 z-50 flex w-3 cursor-col-resize select-none items-center justify-center"
          >
            <div className="h-full w-[3px] transition-colors group-hover:bg-primary/70 group-active:bg-primary" />
          </div>
        )}

        <div className="flex h-full w-full flex-col overflow-hidden">
          <CopilotHeader
            section={copilot.activeSection}
            autoMode={copilot.autoMode}
            onToggleAutoMode={copilot.toggleAutoMode}
            onClear={copilot.clearChat}
            onClose={onClose}
          />

          <CopilotMessageList
            messages={copilot.messages}
            loading={copilot.loading}
            savingNoteId={copilot.savingNoteId}
            creatingEntityKey={copilot.creatingEntityKey}
            creatingRelationKey={copilot.creatingRelationKey}
            deletingRelationKey={copilot.deletingRelationKey}
            creatingAttributeKey={copilot.creatingAttributeKey}
            deletingEntityKey={copilot.deletingEntityKey}
            creatingTaskKey={copilot.creatingTaskKey}
            executingSystemActionKey={copilot.executingSystemActionKey}
            applyingAllMessageId={copilot.applyingAllMessageId}
            onSaveAdr={copilot.handleSaveAdr}
            onCreateEntity={copilot.handleCreateEntity}
            onCreateRelation={copilot.handleCreateRelation}
            onDeleteRelation={copilot.handleDeleteRelation}
            onCreateAttribute={copilot.handleCreateAttribute}
            onDeleteEntity={copilot.handleDeleteEntity}
            onCreateTask={copilot.handleCreateTask}
            onExecuteSystemAction={copilot.handleExecuteSystemAction}
            onApplyAll={copilot.handleApplyAll}
          />

          {copilot.messages.length <= 1 && (
            <CopilotQuickSuggestions
              questions={copilot.quickQuestions}
              onSelect={copilot.sendMessage}
              disabled={copilot.loading}
            />
          )}

          <CopilotInput
            section={copilot.activeSection}
            loading={copilot.loading}
            onSend={copilot.sendMessage}
          />
        </div>
      </aside>
    </>
  )
}
