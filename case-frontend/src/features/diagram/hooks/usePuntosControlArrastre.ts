import { useEffect, useRef, useState } from "react"
import type { InternalNode, Node } from "@xyflow/react"
import { encontrarSegmentoMasCercano, puntoSeparacionInicial } from "../lib/controlPoints"
import type { PuntoControl } from "../types/diagram.types"

/** Umbral de movimiento (px de pantalla) para distinguir un click de un arrastre real — necesario
 * para que "Ctrl+click sobre un punto" (borrarlo) no se confunda con "Ctrl+arrastrar un poquito"
 * (moverlo). */
const UMBRAL_DRAG_PX = 4

/**
 * Estado + eventos de arrastre de los puntos de control manuales de una relación — extraído de
 * `UmlRelationEdge.tsx` (regla "Anti-1k-Lines" del proyecto) porque es lógica de interacción pura,
 * sin nada de JSX. `Ctrl`+arrastrar sobre la línea agrega un punto nuevo justo ahí y lo deja siendo
 * arrastrado; arrastrar un punto existente lo mueve (sin necesitar `Ctrl` — no hay ambigüedad con
 * nada más en ese punto exacto); `Ctrl`+click (sin arrastre real, ver `UMBRAL_DRAG_PX`) sobre un
 * punto existente lo quita. El estado de arrastre es 100% local (`puntosLocal`) hasta soltar —
 * recién ahí se llama `onMoverPuntos` (persiste contra el backend y dispara el `refetch()` de
 * siempre), para no golpear la API en cada pixel del arrastre.
 */
export function usePuntosControlArrastre({
  puntosServidor,
  offsetParalelo,
  nodoOrigen,
  nodoDestino,
  onMoverPuntos,
  screenToFlowPosition,
}: {
  puntosServidor: PuntoControl[]
  offsetParalelo: number
  nodoOrigen: InternalNode<Node> | undefined
  nodoDestino: InternalNode<Node> | undefined
  onMoverPuntos: (puntos: PuntoControl[]) => void
  screenToFlowPosition: (punto: { x: number; y: number }) => { x: number; y: number }
}) {
  const [puntosLocal, setPuntosLocal] = useState<PuntoControl[]>(puntosServidor)
  const puntosLocalRef = useRef(puntosLocal)
  const arrastrandoRef = useRef(false)
  const indiceArrastreRef = useRef<number | null>(null)
  const ctrlAlInicioRef = useRef(false)
  const fueDragRef = useRef(false)
  const inicioClienteRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    puntosLocalRef.current = puntosLocal
  }, [puntosLocal])

  // No pisar el arrastre en curso con lo que venga del servidor (puede llegar un refetch de otra
  // mutación mientras se está moviendo un punto a mano). Si el servidor sigue sin puntos propios
  // pero esta relación necesita separarse de una "paralela" (ver `offsetParalelo`), se siembra el
  // punto inicial una sola vez (`prev.length > 0` evita recalcularlo en cada refetch y perder un
  // arrastre que todavía no se persistió).
  useEffect(() => {
    if (arrastrandoRef.current) return
    if (puntosServidor.length > 0) {
      setPuntosLocal(puntosServidor)
      return
    }
    if (offsetParalelo !== 0 && nodoOrigen && nodoDestino) {
      setPuntosLocal((prev) => (prev.length > 0 ? prev : [puntoSeparacionInicial(nodoOrigen, nodoDestino, offsetParalelo)]))
      return
    }
    setPuntosLocal([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntosServidor, offsetParalelo])

  function terminarArrastre() {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    arrastrandoRef.current = false
  }

  function handlePointerMove(e: PointerEvent) {
    if (indiceArrastreRef.current === null) return
    const dx = e.clientX - inicioClienteRef.current.x
    const dy = e.clientY - inicioClienteRef.current.y
    if (Math.hypot(dx, dy) >= UMBRAL_DRAG_PX) fueDragRef.current = true

    const punto = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const indice = indiceArrastreRef.current
    setPuntosLocal((prev) => prev.map((p, i) => (i === indice ? punto : p)))
  }

  function handlePointerUp() {
    const indice = indiceArrastreRef.current
    terminarArrastre()
    indiceArrastreRef.current = null
    if (indice === null) return

    if (ctrlAlInicioRef.current && !fueDragRef.current) {
      const siguiente = puntosLocalRef.current.filter((_, i) => i !== indice)
      setPuntosLocal(siguiente)
      onMoverPuntos(siguiente)
    } else if (fueDragRef.current) {
      onMoverPuntos(puntosLocalRef.current)
    }
  }

  function iniciarArrastre(indice: number, e: React.PointerEvent, ctrlKey: boolean) {
    inicioClienteRef.current = { x: e.clientX, y: e.clientY }
    ctrlAlInicioRef.current = ctrlKey
    fueDragRef.current = false
    indiceArrastreRef.current = indice
    arrastrandoRef.current = true
    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  function handlePointerDownPunto(indice: number, e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    iniciarArrastre(indice, e, e.ctrlKey)
  }

  /** Ctrl+arrastrar directo sobre la línea agrega un punto ahí mismo — sin Ctrl, el evento sigue
   * su curso normal (selección de la arista), nada se intercepta. */
  function handlePointerDownLinea(e: React.PointerEvent<SVGPathElement>) {
    if (!e.ctrlKey) return
    e.stopPropagation()
    e.preventDefault()

    const puntoNuevo = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const indiceInsercion = encontrarSegmentoMasCercano(puntoNuevo, nodoOrigen, nodoDestino, puntosLocalRef.current)
    const siguiente = [...puntosLocalRef.current]
    siguiente.splice(indiceInsercion, 0, puntoNuevo)
    setPuntosLocal(siguiente)
    fueDragRef.current = true
    iniciarArrastre(indiceInsercion, e, true)
  }

  // Solo limpieza al desmontar (cambiar de página con un arrastre a medio hacer, etc.) — no debe
  // re-ejecutarse en cada render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => terminarArrastre, [])

  return { puntosLocal, handlePointerDownPunto, handlePointerDownLinea }
}
