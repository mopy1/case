import { useState, useMemo, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { createNote } from "@/features/notes/api/notesApi"
import { getDiagram } from "@/features/diagram/api/diagramApi"
import type { AdrSuggestion, CopilotMessage, EntitySuggestion, RelationSuggestion } from "../types/copilot.types"
import { getQuickQuestionsForSection } from "../lib/copilotQuestions"
import { askCopilot } from "../lib/geminiService"
import {
  executeCreateEntity,
  executeCreateRelation,
  updateEntityCreatedInMessages,
  updateRelationCreatedInMessages,
} from "../lib/copilotDiagramActions"
import { createWelcomeMessage, detectActiveSection } from "../lib/copilotSection"

export function useCopilot(proyectoId: number) {
  const location = useLocation()
  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname])

  const [messages, setMessages] = useState<CopilotMessage[]>([createWelcomeMessage(activeSection)])
  const [loading, setLoading] = useState(false)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)
  const [creatingEntityKey, setCreatingEntityKey] = useState<string | null>(null)
  const [creatingRelationKey, setCreatingRelationKey] = useState<string | null>(null)

  const quickQuestions = useMemo(() => getQuickQuestionsForSection(activeSection), [activeSection])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: CopilotMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        section: activeSection,
      }

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const diagram = await getDiagram(proyectoId).catch(() => undefined)
        const res = await askCopilot(trimmed, activeSection, diagram)
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            sender: "assistant",
            text: res.text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            adrSuggestion: res.adrSuggestion,
            entitySuggestions: res.entitySuggestions,
            relationSuggestions: res.relationSuggestions,
            section: activeSection,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [activeSection, loading, proyectoId]
  )

  const handleSaveAdr = useCallback(
    async (messageId: string, adr: AdrSuggestion) => {
      if (!proyectoId || savingNoteId) return
      setSavingNoteId(messageId)
      try {
        const nota = await createNote(proyectoId, { accion: adr.accion, motivo: adr.motivo })
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId && m.adrSuggestion ? { ...m, adrSuggestion: { ...m.adrSuggestion, guardada: true } } : m))
        )
        window.dispatchEvent(new CustomEvent("project:note-created", { detail: { proyectoId, nota } }))
      } catch (err) {
        console.error("Error al guardar nota ADR:", err)
      } finally {
        setSavingNoteId(null)
      }
    },
    [proyectoId, savingNoteId]
  )

  const handleCreateEntity = useCallback(
    async (messageId: string, index: number, entity: EntitySuggestion) => {
      if (!proyectoId) return
      setCreatingEntityKey(`${messageId}-ent-${index}`)
      try {
        await executeCreateEntity(proyectoId, entity)
        setMessages((prev) => updateEntityCreatedInMessages(prev, messageId, index))
      } catch (err) {
        console.error("Error al crear tabla desde Copilot:", err)
      } finally {
        setCreatingEntityKey(null)
      }
    },
    [proyectoId]
  )

  const handleCreateRelation = useCallback(
    async (messageId: string, index: number, relation: RelationSuggestion) => {
      if (!proyectoId) return
      setCreatingRelationKey(`${messageId}-rel-${index}`)
      try {
        await executeCreateRelation(proyectoId, relation)
        setMessages((prev) => updateRelationCreatedInMessages(prev, messageId, index))
      } catch (err) {
        console.error("Error al crear relación desde Copilot:", err)
      } finally {
        setCreatingRelationKey(null)
      }
    },
    [proyectoId]
  )

  const clearChat = useCallback(() => {
    setMessages([createWelcomeMessage(activeSection)])
  }, [activeSection])

  return {
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
  }
}
