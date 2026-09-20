import { useEffect, useState } from "react"
import { useCopilot } from "../hooks/useCopilot"
import { CopilotHeader } from "./copilot-header"
import { CopilotInput } from "./copilot-input"
import { CopilotMessageList } from "./copilot-message-list"
import { CopilotQuickSuggestions } from "./copilot-quick-suggestions"

interface CopilotPanelProps {
  proyectoId: number
  isOpen: boolean
  onClose: () => void
}

const WIDTH_STORAGE_KEY = "sw_case_copilot_width"
const DEFAULT_WIDTH = 350
const MIN_WIDTH = 280
const MAX_WIDTH = 720

export function CopilotPanel({ proyectoId, isOpen, onClose }: CopilotPanelProps) {
  const copilot = useCopilot(proyectoId)

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(WIDTH_STORAGE_KEY)
    const parsed = saved ? Number(saved) : DEFAULT_WIDTH
    return Number.isFinite(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : DEFAULT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => setWidth(Math.min(Math.max(window.innerWidth - e.clientX, MIN_WIDTH), MAX_WIDTH))
    const onUp = () => setIsDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging])

  useEffect(() => {
    localStorage.setItem(WIDTH_STORAGE_KEY, String(width))
  }, [width])

  return (
    <aside
      aria-label="Panel Asistente IA y Manual CASE"
      style={{ width: isOpen ? `${width}px` : 0 }}
      className={`relative h-full shrink-0 border-border bg-card ${
        isDragging ? "select-none" : "transition-[width,opacity] duration-200 ease-out"
      } ${isOpen ? "border-l opacity-100 shadow-xl" : "border-l-0 overflow-hidden opacity-0 pointer-events-none"}`}
    >
      {isOpen && (
        <div
          role="separator"
          onMouseDown={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
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
  )
}
