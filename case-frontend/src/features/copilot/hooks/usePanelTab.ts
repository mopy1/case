import { useCallback, useEffect, useState } from "react"
import { escuchar, EVENTO, type GuiaPanelDetail } from "@/features/guia"

export type PanelTab = "equipo" | "copilot"

const TAB_STORAGE_KEY = "sw_case_panel_tab"

function leerTabGuardada(): PanelTab {
  try {
    return localStorage.getItem(TAB_STORAGE_KEY) === "copilot" ? "copilot" : "equipo"
  } catch {
    return "equipo"
  }
}

/** Pestaña activa del panel lateral, recordada en localStorage. El push-to-talk salta a "copilot"; `guia:panel` elige la pestaña. */
export function usePanelTab() {
  const [tab, setTabState] = useState<PanelTab>(leerTabGuardada)

  const setTab = useCallback((nueva: PanelTab) => {
    setTabState(nueva)
    try {
      localStorage.setItem(TAB_STORAGE_KEY, nueva)
    } catch {
      // Sin storage (modo privado): la pestaña vale solo para esta sesión.
    }
  }, [])

  useEffect(() => {
    const mostrarCopilot = () => setTab("copilot")
    window.addEventListener("copilot:voice-submit", mostrarCopilot)
    return () => window.removeEventListener("copilot:voice-submit", mostrarCopilot)
  }, [setTab])

  useEffect(() => escuchar<GuiaPanelDetail>(EVENTO.panel, (d) => d?.tab && setTab(d.tab)), [setTab])

  return { tab, setTab }
}
