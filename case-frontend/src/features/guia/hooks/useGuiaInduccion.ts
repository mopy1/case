import { useEffect, useRef } from "react"
import { escuchar, EVENTO } from "../lib/guiaEventos"
import type { GuiaPanelDetail } from "../types/guia.types"
import { useGuiaDeteccion } from "./useGuiaDeteccion"
import { useGuiaOferta } from "./useGuiaOferta"

interface PanelControl {
  abrir: () => void
  cerrar: () => void
  /** Un coach mark necesita ver la página: sale de la pantalla completa del chat. */
  alMostrarPaso: () => void
}

/** Montado una vez en `ProjectLayout`: detección + oferta única + `guia:panel` abre o cierra el panel. */
export function useGuiaInduccion(proyectoId: number, panel: PanelControl) {
  useGuiaDeteccion(proyectoId)
  useGuiaOferta()

  const panelRef = useRef(panel)
  useEffect(() => {
    panelRef.current = panel
  })

  useEffect(() => {
    const offPanel = escuchar<GuiaPanelDetail>(EVENTO.panel, (d) => (d?.cerrar ? panelRef.current.cerrar() : panelRef.current.abrir()))
    const offPaso = escuchar(EVENTO.paso, () => panelRef.current.alMostrarPaso())
    return () => {
      offPanel()
      offPaso()
    }
  }, [])
}
