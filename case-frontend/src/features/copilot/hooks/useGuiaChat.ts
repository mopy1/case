import { useCallback, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { useGuiaProgreso } from "@/features/guia"
import { mensajeDeError } from "@/lib/api"
import { consultarCopilot } from "../api/copilotApi"
import { detectActiveSection } from "../lib/copilotSection"
import { parsearRespuestaGuia } from "../lib/guiaRespuesta"
import type { CopilotTurno } from "../types/copilotApi.types"
import type { GuiaMensaje } from "../types/copilot.types"

const HISTORIAL_TURNOS = 6
const TURNO_MAX_CHARS = 1500

const nuevo = (m: Omit<GuiaMensaje, "id" | "timestamp">): GuiaMensaje => ({
  ...m,
  id: `${m.sender}-${Date.now()}`,
  timestamp: new Date().toISOString(),
})

/** Conversación con la Guía: en memoria (se pierde al recargar), manda los últimos 6 turnos y las misiones pendientes. */
export function useGuiaChat(proyectoId: number) {
  const { pathname } = useLocation()
  const seccion = useMemo(() => detectActiveSection(pathname), [pathname])
  const { pendientes } = useGuiaProgreso()
  const [mensajes, setMensajes] = useState<GuiaMensaje[]>([])
  const [loading, setLoading] = useState(false)

  const enviar = useCallback(
    async (entrada: string) => {
      const texto = entrada.trim()
      if (!texto || loading) return
      const historial: CopilotTurno[] = mensajes
        .filter((m) => !m.error)
        .slice(-HISTORIAL_TURNOS)
        .map((m) => ({ rol: m.sender === "user" ? "usuario" : "asistente", texto: m.text.slice(0, TURNO_MAX_CHARS) }))
      setMensajes((prev) => [...prev, nuevo({ sender: "user", text: texto })])
      setLoading(true)
      try {
        const res = await consultarCopilot(proyectoId, { modo: "GUIA", texto, seccion, historial, misionesPendientes: pendientes })
        const r = parsearRespuestaGuia(res.texto)
        const fuentes = res.herramientasUsadas?.includes("buscarManual") ? ["Manual"] : undefined
        setMensajes((prev) => [...prev, nuevo({ sender: "assistant", text: r.texto, pasos: r.pasos, irA: r.irA, fuentes })])
      } catch (err) {
        setMensajes((prev) => [...prev, nuevo({ sender: "assistant", text: mensajeDeError(err), error: true })])
      } finally {
        setLoading(false)
      }
    },
    [loading, mensajes, proyectoId, seccion, pendientes]
  )

  const reiniciar = useCallback(() => setMensajes([]), [])

  return { mensajes, loading, seccion, enviar, reiniciar }
}
