import { useEffect } from "react"
import { useCopilot } from "../hooks/useCopilot"
import { CopilotHeader } from "./copilot-header"
import { CopilotInput } from "./copilot-input"
import { CopilotMessageList } from "./copilot-message-list"
import { CopilotQuickSuggestions } from "./copilot-quick-suggestions"

interface CopilotAssistantViewProps {
  proyectoId: number
}

/** Pestaña "Copilot" del panel lateral: el asistente IA tal cual era antes de las pestañas. */
export function CopilotAssistantView({ proyectoId }: CopilotAssistantViewProps) {
  const copilot = useCopilot(proyectoId)
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
      <CopilotHeader
        section={copilot.activeSection}
        autoMode={copilot.autoMode}
        onToggleAutoMode={copilot.toggleAutoMode}
        onClear={copilot.clearChat}
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

      <CopilotInput section={copilot.activeSection} loading={copilot.loading} onSend={copilot.sendMessage} />
    </>
  )
}
