import { useState, useMemo, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { getDiagram } from "@/features/diagram/api/diagramApi"
import type { CopilotMessage } from "../types/copilot.types"
import { getQuickQuestionsForSection } from "../lib/copilotQuestions"
import { askCopilot } from "../lib/geminiService"
import type { ProcessedImage } from "../lib/copilotImageUtils"
import { detectActiveSection } from "../lib/copilotSection"
import { useCopilotActionHandlers } from "./useCopilotActionHandlers"
import { executeAllMessageChanges } from "../lib/copilotBatchExecutor"
import { markAllAppliedInMessage } from "../lib/copilotMessageUpdaters"
import { hasAnyActions } from "../lib/copilotPendingActions"

const AUTO_MODE_KEY = "sw_case_copilot_auto_mode"

export function useCopilot(proyectoId: number) {
  const location = useLocation()
  const activeSection = useMemo(() => detectActiveSection(location.pathname), [location.pathname])
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [autoMode, setAutoMode] = useState<boolean>(() => localStorage.getItem(AUTO_MODE_KEY) === "true")

  const quickQuestions = useMemo(() => getQuickQuestionsForSection(activeSection), [activeSection])
  const handlers = useCopilotActionHandlers(proyectoId, setMessages)

  const toggleAutoMode = useCallback(() => {
    setAutoMode((prev) => {
      const next = !prev
      localStorage.setItem(AUTO_MODE_KEY, String(next))
      return next
    })
  }, [])

  const sendMessage = useCallback(
    async (text: string, image?: ProcessedImage) => {
      const trimmed = text.trim()
      if ((!trimmed && !image) || loading) return

      const displayText = trimmed || (image ? "Diagrama enviado para reconocimiento" : "")
      const userMsg: CopilotMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: displayText,
        imageUrl: image?.previewUrl,
        timestamp: new Date().toISOString(),
        section: activeSection,
      }

      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const diagram = await getDiagram(proyectoId).catch(() => undefined)
        const res = await askCopilot(trimmed, activeSection, diagram, image)
        const assistantMsgId = `assistant-${Date.now()}`
        const assistantMsg: CopilotMessage = {
          id: assistantMsgId,
          sender: "assistant",
          text: res.text,
          timestamp: new Date().toISOString(),
          adrSuggestion: res.adrSuggestion,
          adrSuggestions: res.adrSuggestions,
          entitySuggestions: res.entitySuggestions,
          relationSuggestions: res.relationSuggestions,
          relationDeleteSuggestions: res.relationDeleteSuggestions,
          attributeSuggestions: res.attributeSuggestions,
          entityDeleteSuggestions: res.entityDeleteSuggestions,
          taskSuggestions: res.taskSuggestions,
          systemActions: res.systemActions,
          section: activeSection,
        }

        setMessages((prev) => [...prev, assistantMsg])

        if (autoMode && hasAnyActions(assistantMsg)) {
          try {
            await executeAllMessageChanges(proyectoId, assistantMsg)
            setMessages((prev) => markAllAppliedInMessage(prev, assistantMsgId))
          } catch (err) {
            console.error("Error al auto-aplicar cambios en Modo Autónomo:", err)
          }
        }
      } finally {
        setLoading(false)
      }
    },
    [activeSection, autoMode, loading, proyectoId]
  )

  const clearChat = useCallback(() => setMessages([]), [])

  return {
    messages,
    loading,
    autoMode,
    toggleAutoMode,
    activeSection,
    quickQuestions,
    sendMessage,
    clearChat,
    ...handlers,
  }
}
