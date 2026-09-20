import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { createNote } from "@/features/notes/api/notesApi"
import type {
  AdrSuggestion,
  CopilotMessage,
  SystemActionSuggestion,
  TaskSuggestion,
} from "../types/copilot.types"
import {
  executeCreateTaskAction,
  executeExportXmiAction,
  executeGenerateBackendAction,
} from "../lib/copilotSystemActions"
import {
  markAllAppliedInMessage,
  updateSystemActionExecutedInMessages,
  updateTaskCreatedInMessages,
} from "../lib/copilotMessageUpdaters"
import { executeAllMessageChanges } from "../lib/copilotBatchExecutor"

export function useCopilotSystemActionHandlers(
  proyectoId: number,
  setMessages: React.Dispatch<React.SetStateAction<CopilotMessage[]>>
) {
  const navigate = useNavigate()
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)
  const [creatingTaskKey, setCreatingTaskKey] = useState<string | null>(null)
  const [executingSystemActionKey, setExecutingSystemActionKey] = useState<string | null>(null)
  const [applyingAllMessageId, setApplyingAllMessageId] = useState<string | null>(null)

  const handleSaveAdr = useCallback(
    async (messageId: string, adr: AdrSuggestion) => {
      if (!proyectoId || savingNoteId) return
      setSavingNoteId(messageId)
      try {
        const nota = await createNote(proyectoId, { accion: adr.accion, motivo: adr.motivo })
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  adrSuggestion: m.adrSuggestion?.accion === adr.accion ? { ...m.adrSuggestion, guardada: true } : m.adrSuggestion,
                  adrSuggestions: m.adrSuggestions?.map((item) =>
                    item.accion === adr.accion ? { ...item, guardada: true } : item
                  ),
                }
              : m
          )
        )
        window.dispatchEvent(new CustomEvent("project:note-created", { detail: { proyectoId, nota } }))
      } finally {
        setSavingNoteId(null)
      }
    },
    [proyectoId, savingNoteId, setMessages]
  )

  const handleCreateTask = useCallback(
    async (messageId: string, index: number, task: TaskSuggestion) => {
      if (!proyectoId) return
      setCreatingTaskKey(`${messageId}-task-${index}`)
      try {
        await executeCreateTaskAction(proyectoId, task)
        setMessages((prev) => updateTaskCreatedInMessages(prev, messageId, index))
      } finally {
        setCreatingTaskKey(null)
      }
    },
    [proyectoId, setMessages]
  )

  const handleExecuteSystemAction = useCallback(
    async (messageId: string, index: number, action: SystemActionSuggestion) => {
      if (!proyectoId) return
      setExecutingSystemActionKey(`${messageId}-sys-${index}`)
      try {
        if (action.tipo === "EXPORTAR_XMI") {
          await executeExportXmiAction(proyectoId)
        } else if (action.tipo === "GENERAR_BACKEND") {
          await executeGenerateBackendAction(proyectoId)
        } else if (action.tipo === "NAVEGAR" && action.destino) {
          navigate(`/proyectos/${proyectoId}/${action.destino}`)
        }
        setMessages((prev) => updateSystemActionExecutedInMessages(prev, messageId, index))
      } finally {
        setExecutingSystemActionKey(null)
      }
    },
    [navigate, proyectoId, setMessages]
  )

  const handleApplyAll = useCallback(
    async (message: CopilotMessage) => {
      if (!proyectoId || applyingAllMessageId) return
      setApplyingAllMessageId(message.id)
      try {
        await executeAllMessageChanges(proyectoId, message)
        setMessages((prev) => markAllAppliedInMessage(prev, message.id))
      } finally {
        setApplyingAllMessageId(null)
      }
    },
    [proyectoId, applyingAllMessageId, setMessages]
  )

  return {
    savingNoteId,
    creatingTaskKey,
    executingSystemActionKey,
    applyingAllMessageId,
    handleSaveAdr,
    handleCreateTask,
    handleExecuteSystemAction,
    handleApplyAll,
  }
}
