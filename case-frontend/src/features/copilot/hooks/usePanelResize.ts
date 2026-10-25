import { useCallback, useEffect, useRef, useState } from "react"
import type { KeyboardEvent, PointerEvent } from "react"

const KEY = "sw_case_copilot_width"
export const PANEL_MIN = 320
export const PANEL_DEFAULT = 420
const CANVAS_MIN = 360 // espacio mínimo para el lienzo
const NAV_RAIL = 56 // ancho de ProjectNavRail
const MAX_RATIO = 0.7

/** Máximo del panel: nunca más del 70 % del viewport ni dejando el lienzo por debajo de 360 px. */
export const panelMax = (vw: number) =>
  Math.max(PANEL_MIN, Math.min(vw - NAV_RAIL - CANVAS_MIN, Math.round(vw * MAX_RATIO)))
const clamp = (w: number, vw: number) => Math.min(Math.max(Math.round(w), PANEL_MIN), panelMax(vw))

function leer() {
  try {
    const n = Number(localStorage.getItem(KEY))
    return Number.isFinite(n) && n > 0 ? n : PANEL_DEFAULT
  } catch {
    return PANEL_DEFAULT
  }
}
function guardar(w: number) {
  try {
    localStorage.setItem(KEY, String(w))
  } catch {
    /* sin storage: vale para la sesión */
  }
}

/** Ancho del panel lateral (escritorio): arrastre con pointer capture, teclado y persistencia al soltar. */
export function usePanelResize() {
  const [preferido, setPreferido] = useState(leer) // lo que eligió el usuario
  const [vw, setVw] = useState(() => window.innerWidth)
  const [isDragging, setIsDragging] = useState(false)
  const frame = useRef(0)

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  const width = clamp(preferido, vw) // se ajusta a la ventana sin perder la preferencia
  const fijar = useCallback((w: number) => {
    const c = clamp(w, window.innerWidth)
    setPreferido(c)
    guardar(c)
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const x = e.clientX
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setPreferido(clamp(window.innerWidth - x, window.innerWidth)))
  }
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    cancelAnimationFrame(frame.current)
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    fijar(window.innerWidth - e.clientX) // persiste una vez, al soltar
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const paso = e.shiftKey ? 64 : 16
    const mapa: Record<string, number> = {
      ArrowLeft: width + paso, // el panel está a la derecha: izquierda = más ancho
      ArrowRight: width - paso,
      Home: PANEL_MIN,
      End: panelMax(vw),
      Enter: PANEL_DEFAULT,
    }
    if (!(e.key in mapa)) return
    e.preventDefault()
    fijar(mapa[e.key])
  }

  useEffect(() => {
    document.body.style.cursor = isDragging ? "col-resize" : ""
    document.body.style.userSelect = isDragging ? "none" : ""
  }, [isDragging])

  return {
    width,
    isDragging,
    min: PANEL_MIN,
    max: panelMax(vw),
    reset: () => fijar(PANEL_DEFAULT),
    handleProps: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onKeyDown },
  }
}
