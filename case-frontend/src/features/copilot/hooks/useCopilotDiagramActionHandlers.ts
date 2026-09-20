import { useState, useCallback } from "react"
import type {
  AttributeSuggestion,
  CopilotMessage,
  EntityDeleteSuggestion,
  EntitySuggestion,
  RelationDeleteSuggestion,
  RelationSuggestion,
} from "../types/copilot.types"
import {
  executeAddAttribute,
  executeCreateEntity,
  executeCreateRelation,
  executeDeleteEntityByName,
} from "../lib/copilotDiagramActions"
import { executeDeleteRelationByName } from "../lib/copilotSystemActions"
import {
  updateAttributeCreatedInMessages,
  updateEntityCreatedInMessages,
  updateEntityDeletedInMessages,
  updateRelationCreatedInMessages,
  updateRelationDeletedInMessages,
} from "../lib/copilotMessageUpdaters"

export function useCopilotDiagramActionHandlers(
  proyectoId: number,
  setMessages: React.Dispatch<React.SetStateAction<CopilotMessage[]>>
) {
  const [creatingEntityKey, setCreatingEntityKey] = useState<string | null>(null)
  const [creatingRelationKey, setCreatingRelationKey] = useState<string | null>(null)
  const [creatingAttributeKey, setCreatingAttributeKey] = useState<string | null>(null)
  const [deletingEntityKey, setDeletingEntityKey] = useState<string | null>(null)
  const [deletingRelationKey, setDeletingRelationKey] = useState<string | null>(null)

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

  const handleDeleteRelation = useCallback(
    async (messageId: string, index: number, suggestion: RelationDeleteSuggestion) => {
      if (!proyectoId) return
      setDeletingRelationKey(`${messageId}-reldel-${index}`)
      try {
        await executeDeleteRelationByName(proyectoId, suggestion.origen, suggestion.destino)
        setMessages((prev) => updateRelationDeletedInMessages(prev, messageId, index))
      } finally {
        setDeletingRelationKey(null)
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

  return {
    creatingEntityKey,
    creatingRelationKey,
    creatingAttributeKey,
    deletingEntityKey,
    deletingRelationKey,
    handleCreateEntity,
    handleCreateRelation,
    handleDeleteRelation,
    handleCreateAttribute,
    handleDeleteEntity,
  }
}
