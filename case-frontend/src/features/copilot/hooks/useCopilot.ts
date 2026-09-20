import { useState, useMemo, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { createNote } from "@/features/notes/api/notesApi"
import type { AdrSuggestion, CopilotMessage, CopilotSection } from "../types/copilot.types"
import { getQuickQuestionsForSection } from "../lib/copilotKnowledge"
import { askCopilot } from "../lib/geminiService"

function detectActiveSection(pathname: string): CopilotSection {
  if (pathname.includes("/diagrama")) return "diagrama"
  if (pathname.includes("/tareas")) return "tareas"
  if (pathname.includes("/notas")) return "notas"
  if (pathname.includes("/xmi")) return "xmi"
  if (pathname.includes("/generador")) return "generador"
  return "general"
}

export function useCopilot(proyectoId: number) {
  const location = useLocation()
  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname])

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "¡Hola! Soy tu copiloto y manual contextual de CASE Tool. Puedo orientarte sobre modelado de datos, generación de backend Spring Boot 3.4, XMI 2.1 y registrar decisiones arquitectónicas (ADRs) directamente en tu proyecto.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      section: activeSection,
    },
  ])

  const [loading, setLoading] = useState(false)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

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
        const response = await askCopilot(trimmed, activeSection)
        const assistantMsg: CopilotMessage = {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          adrSuggestion: response.adrSuggestion,
          section: activeSection,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } finally {
        setLoading(false)
      }
    },
    [activeSection, loading]
  )

  const handleSaveAdr = useCallback(
    async (messageId: string, adr: AdrSuggestion) => {
      if (!proyectoId || savingNoteId) return
      setSavingNoteId(messageId)
      try {
        const nuevaNota = await createNote(proyectoId, {
          accion: adr.accion,
          motivo: adr.motivo,
        })
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.adrSuggestion
              ? { ...msg, adrSuggestion: { ...msg.adrSuggestion, guardada: true } }
              : msg
          )
        )
        // Notificar a la pantalla de notas para que se actualice sola en tiempo real
        window.dispatchEvent(
          new CustomEvent("project:note-created", {
            detail: { proyectoId, nota: nuevaNota },
          })
        )
      } catch (err) {
        console.error("Error al guardar nota ADR:", err)
      } finally {
        setSavingNoteId(null)
      }
    },
    [proyectoId, savingNoteId]
  )

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        text: `Conversación reiniciada. ¿En qué te puedo ayudar en la sección de **${activeSection}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        section: activeSection,
      },
    ])
  }, [activeSection])

  return {
    messages,
    loading,
    activeSection,
    quickQuestions,
    savingNoteId,
    sendMessage,
    handleSaveAdr,
    clearChat,
  }
}
