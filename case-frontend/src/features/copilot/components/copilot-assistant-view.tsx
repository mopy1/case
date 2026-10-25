import { useEffect, type ReactNode } from "react"
import { Bot } from "lucide-react"
import { ChatEmpty, ChatQuickActions, ChatShell } from "@/components/chat"
import type { QuickAction } from "@/components/chat"
import { useCopilot } from "../hooks/useCopilot"
import { CopilotComposer } from "./copilot-composer"
import { CopilotHeader } from "./copilot-header"
import { CopilotMessageList } from "./copilot-message-list"

interface CopilotAssistantViewProps {
  proyectoId: number
  /** Solo la vista activa atiende el push-to-talk. */
  activo?: boolean
  modeSwitch?: ReactNode
}

/** Modo Asistente del Copilot: individual (solo lo ve el usuario), arma tarjetas aplicables sobre el sistema de chat compartido. */
export function CopilotAssistantView({ proyectoId, activo = true, modeSwitch }: CopilotAssistantViewProps) {
  const copilot = useCopilot(proyectoId)
  const { sendMessage, quickQuestions } = copilot
  const [primera, ...resto] = quickQuestions
  const sugerencias: QuickAction[] = resto.map((q) => ({ id: q, label: q }))

  // Texto dictado con push-to-talk (ver `ProjectLayout`): depende de `sendMessage` (useCallback).
  useEffect(() => {
    if (!activo) return
    const onVoiceSubmit = (e: Event) => {
      const texto = (e as CustomEvent<{ text: string }>).detail?.text
      if (texto) void sendMessage(texto)
    }
    window.addEventListener("copilot:voice-submit", onVoiceSubmit)
    return () => window.removeEventListener("copilot:voice-submit", onVoiceSubmit)
  }, [activo, sendMessage])

  return (
    <ChatShell
      header={
        <CopilotHeader
          section={copilot.activeSection}
          autoMode={copilot.autoMode}
          onToggleAutoMode={copilot.toggleAutoMode}
          onClear={copilot.clearChat}
          canClear={copilot.messages.length > 0}
          modeSwitch={modeSwitch}
        />
      }
      composer={<CopilotComposer section={copilot.activeSection} loading={copilot.loading} onSend={sendMessage} />}
    >
      {copilot.messages.length === 0 && !copilot.loading ? (
        <ChatEmpty
          icon={Bot}
          title="Tu asistente del diagrama"
          description="Lo que hablés acá lo ves solo vos. Pedile tablas, relaciones o subí la foto de un diagrama."
          primaryAction={{ label: primera ?? "¿Qué podés hacer?", onClick: () => void sendMessage(primera ?? "¿Qué podés hacer?") }}
        >
          <ChatQuickActions actions={sugerencias} onSelect={(a) => void sendMessage(a.label)} ariaLabel="Sugerencias rápidas" layout="stack" />
        </ChatEmpty>
      ) : (
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
      )}
    </ChatShell>
  )
}
