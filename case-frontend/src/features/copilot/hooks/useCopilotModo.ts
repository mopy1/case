import { useCallback, useEffect, useState } from "react"
import { escuchar, EVENTO, type GuiaPanelDetail } from "@/features/guia"

export type CopilotModoVista = "asistente" | "guia"

const MODO_KEY = "sw_case_copilot_modo"

function leerModo(): CopilotModoVista {
  try {
    return localStorage.getItem(MODO_KEY) === "guia" ? "guia" : "asistente"
  } catch {
    return "asistente"
  }
}

/** Modo del Copilot (Asistente · Guía), recordado en localStorage; `guia:panel { modoGuia }` lo pasa a Guía. */
export function useCopilotModo() {
  const [modo, setModoState] = useState<CopilotModoVista>(leerModo)

  const setModo = useCallback((nuevo: CopilotModoVista) => {
    setModoState(nuevo)
    try {
      localStorage.setItem(MODO_KEY, nuevo)
    } catch {
      // Sin storage: el modo vale solo para esta sesión.
    }
  }, [])

  useEffect(() => escuchar<GuiaPanelDetail>(EVENTO.panel, (d) => d?.modoGuia && setModo("guia")), [setModo])

  return { modo, setModo }
}
