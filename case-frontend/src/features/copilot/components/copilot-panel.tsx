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
  const {
    messages,
    loading,
    activeSection,
    quickQuestions,
    savingNoteId,
    creatingEntityKey,
    creatingRelationKey,
    sendMessage,
    handleSaveAdr,
    handleCreateEntity,
    handleCreateRelation,
    clearChat,
  } = useCopilot(proyectoId)

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(WIDTH_STORAGE_KEY)
    const parsed = saved ? Number(saved) : DEFAULT_WIDTH
    return Number.isFinite(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH ? parsed : DEFAULT_WIDTH
  })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // Al estar a la derecha, el nuevo ancho es la distancia desde el cursor hasta el borde derecho
      const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, MIN_WIDTH), MAX_WIDTH)
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
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
      } ${
        isOpen
          ? "border-l opacity-100 shadow-xl"
          : "border-l-0 overflow-hidden opacity-0 pointer-events-none"
      }`}
    >
      {/* Tirador para arrastrar y agrandar/achicar ancho (estilo VS Code) */}
      {isOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
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
          section={activeSection}
          onClear={clearChat}
          onClose={onClose}
        />

        <CopilotMessageList
          messages={messages}
          loading={loading}
          savingNoteId={savingNoteId}
          creatingEntityKey={creatingEntityKey}
          creatingRelationKey={creatingRelationKey}
          onSaveAdr={handleSaveAdr}
          onCreateEntity={handleCreateEntity}
          onCreateRelation={handleCreateRelation}
        />

        <CopilotQuickSuggestions
          questions={quickQuestions}
          onSelect={sendMessage}
          disabled={loading}
        />

        <CopilotInput
          section={activeSection}
          loading={loading}
          onSend={sendMessage}
        />
      </div>
    </aside>
  )
}
