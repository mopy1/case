import { useState, useMemo, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { getDiagram } from "@/features/diagram/api/diagramApi"
import type { CopilotMessage } from "../types/copilot.types"
import { getQuickQuestionsForSection } from "../lib/copilotQuestions"
import { askCopilot } from "../lib/geminiService"
import { createWelcomeMessage, detectActiveSection } from "../lib/copilotSection"
import { useCopilotActionHandlers } from "./useCopilotActionHandlers"

export function useCopilot(proyectoId: number) {
  const location = useLocation()
  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname])
  const [messages, setMessages] = useState<CopilotMessage[]>([createWelcomeMessage(activeSection)])
  const [loading, setLoading] = useState(false)

  const quickQuestions = useMemo(() => getQuickQuestionsForSection(activeSection), [activeSection])
  const handlers = useCopilotActionHandlers(proyectoId, setMessages)

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
            adrSuggestions: res.adrSuggestions,
            entitySuggestions: res.entitySuggestions,
            relationSuggestions: res.relationSuggestions,
            attributeSuggestions: res.attributeSuggestions,
            entityDeleteSuggestions: res.entityDeleteSuggestions,
            section: activeSection,
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [activeSection, loading, proyectoId]
  )

  const clearChat = useCallback(() => {
    setMessages([createWelcomeMessage(activeSection)])
  }, [activeSection])

  return {
    messages,
    loading,
    activeSection,
    quickQuestions,
    sendMessage,
    clearChat,
    ...handlers,
  }
}
