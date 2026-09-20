import { useCallback, useEffect, useState } from "react"
import type { DiagramaResponse } from "../types/diagram.types"
import { getDiagram } from "../api/diagramApi"

const VACIO: DiagramaResponse = { entidades: [], relaciones: [] }

/** `loading` solo se prende en la carga inicial (o al cambiar de proyecto) — a propósito
 * (2026-09-20, bug real corregido, reportado como "parpadeo... cada que muevo algo"). Antes
 * `refetch()` también ponía `loading=true`, y como el editor se llama ese mismo `refetch` después
 * de CUALQUIER mutación (mover un punto de control, editar una multiplicidad, etc. — ver
 * `useDiagramCanvas`), `DiagramEditorPage` reemplazaba todo el lienzo por el `<Skeleton/>` de
 * pantalla completa en cada una de esas acciones, y al volver a montar `<ReactFlow fitView>` de
 * cero reencuadraba el zoom — el parpadeo reportado. Ahora `refetch()` solo actualiza `diagrama`
 * en silencio; el lienzo se queda montado y visible todo el tiempo, se actualiza solo cuando llega
 * la respuesta nueva (patrón "stale-while-revalidate" estándar). */
export function useDiagram(proyectoId: number) {
  const [diagrama, setDiagrama] = useState<DiagramaResponse>(VACIO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(() => {
    setError(null)
    return getDiagram(proyectoId)
      .then((data) => setDiagrama(data))
      .catch((err) => setError(err.message || "No se pudo conectar con el servidor"))
  }, [proyectoId])

  useEffect(() => {
    setLoading(true)
    refetch().finally(() => setLoading(false))
  }, [refetch])

  useEffect(() => {
    const handleDiagramUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ proyectoId: number }>
      if (customEvent.detail?.proyectoId === proyectoId) {
        refetch()
      }
    }
    window.addEventListener("project:diagram-updated", handleDiagramUpdated)
    return () => window.removeEventListener("project:diagram-updated", handleDiagramUpdated)
  }, [proyectoId, refetch])

  return { diagrama, loading, error, refetch }
}
