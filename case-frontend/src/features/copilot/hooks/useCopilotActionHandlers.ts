import { useState, useCallback } from "react"
import { createNote } from "@/features/notes/api/notesApi"
import type {
  AdrSuggestion,
  AttributeSuggestion,
  CopilotMessage,
  EntityDeleteSuggestion,
  EntitySuggestion,
  RelationSuggestion,
} from "../types/copilot.types"
import {
  executeAddAttribute,
  executeCreateEntity,
  executeCreateRelation,
  executeDeleteEntityByName,
} from "../lib/copilotDiagramActions"
import {
  markAllAppliedInMessage,
  updateAttributeCreatedInMessages,
  updateEntityCreatedInMessages,
  updateEntityDeletedInMessages,
  updateRelationCreatedInMessages,
} from "../lib/copilotMessageUpdaters"
import { executeAllMessageChanges } from "../lib/copilotBatchExecutor"

export function useCopilotActionHandlers(
  proyectoId: number,
  setMessages: React.Dispatch<React.SetStateAction<CopilotMessage[]>>
) {
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)
  const [creatingEntityKey, setCreatingEntityKey] = useState<string | null>(null)
  const [creatingRelationKey, setCreatingRelationKey] = useState<string | null>(null)
  const [creatingAttributeKey, setCreatingAttributeKey] = useState<string | null>(null)
  const [deletingEntityKey, setDeletingEntityKey] = useState<string | null>(null)
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

  const handleCreateEntity = useCallback(
    async (messageId: string, index: number, entity: EntitySuggestion) => {
      if (!proyectoId) return
      setCreatingEntityKey(`${messageId}-ent-${index}`)
      try {
        await executeCreateEntity(proyectoId, entity)
        setMessages((prev) => updateEntityCreatedInMessages(prev, messageId, index))
      } finally {
        setCreatingEntityKey(null)
      }
    },
    [proyectoId, setMessages]
  )

  const handleCreateRelation = useCallback(
    async (messageId: string, index: number, relation: RelationSuggestion) => {
      if (!proyectoId) return
      setCreatingRelationKey(`${messageId}-rel-${index}`)
      try {
        await executeCreateRelation(proyectoId, relation)
        setMessages((prev) => updateRelationCreatedInMessages(prev, messageId, index))
      } finally {
        setCreatingRelationKey(null)
      }
    },
    [proyectoId, setMessages]
  )

  const handleCreateAttribute = useCallback(
    async (messageId: string, index: number, attribute: AttributeSuggestion) => {
      if (!proyectoId) return
      setCreatingAttributeKey(`${messageId}-attr-${index}`)
      try {
        await executeAddAttribute(proyectoId, attribute)
        setMessages((prev) => updateAttributeCreatedInMessages(prev, messageId, index))
      } finally {
        setCreatingAttributeKey(null)
      }
    },
    [proyectoId, setMessages]
  )

  const handleDeleteEntity = useCallback(
    async (messageId: string, index: number, suggestion: EntityDeleteSuggestion) => {
      if (!proyectoId) return
      setDeletingEntityKey(`${messageId}-del-${index}`)
      try {
        await executeDeleteEntityByName(proyectoId, suggestion.tabla)
        setMessages((prev) => updateEntityDeletedInMessages(prev, messageId, index))
      } finally {
        setDeletingEntityKey(null)
      }
    },
    [proyectoId, setMessages]
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
    creatingEntityKey,
    creatingRelationKey,
    creatingAttributeKey,
    deletingEntityKey,
    applyingAllMessageId,
    handleSaveAdr,
    handleCreateEntity,
    handleCreateRelation,
    handleCreateAttribute,
    handleDeleteEntity,
    handleApplyAll,
  }
}
