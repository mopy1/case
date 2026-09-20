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

export function CopilotPanel({ proyectoId, isOpen, onClose }: CopilotPanelProps) {
  const {
    messages,
    loading,
    activeSection,
    quickQuestions,
    savingNoteId,
    sendMessage,
    handleSaveAdr,
    clearChat,
  } = useCopilot(proyectoId)

  return (
    <aside
      aria-label="Panel Asistente IA y Manual CASE"
      className={`h-full shrink-0 border-border bg-card transition-all duration-300 ease-in-out ${
        isOpen
          ? "w-80 border-l opacity-100 shadow-xl"
          : "w-0 border-l-0 overflow-hidden opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex h-full w-80 flex-col overflow-hidden">
        <CopilotHeader
          section={activeSection}
          onClear={clearChat}
          onClose={onClose}
        />

        <CopilotMessageList
          messages={messages}
          loading={loading}
          savingNoteId={savingNoteId}
          onSaveAdr={handleSaveAdr}
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
