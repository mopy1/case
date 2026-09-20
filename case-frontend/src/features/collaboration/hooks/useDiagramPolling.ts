import { useEffect, useRef } from "react"
import { getDiagram } from "@/features/diagram/api/diagramApi"

const POLLING_INTERVAL_MS = 7000

/**
 * Polling inteligente cada 7s llamando a getDiagram silenciosamente.
 * Detecta cambios hechos por otros usuarios en otros navegadores y dispara
 * "project:diagram-updated" solo si la respuesta cambió.
 */
export function useDiagramPolling(proyectoId: number) {
  const lastSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (!proyectoId || Number.isNaN(proyectoId)) return

    let isMounted = true

    // Carga la firma inicial silenciosamente
    getDiagram(proyectoId)
      .then((data) => {
        if (isMounted) {
          lastSignatureRef.current = JSON.stringify(data)
        }
      })
      .catch(() => {})

    const intervalId = setInterval(async () => {
      try {
        const data = await getDiagram(proyectoId)
        if (!isMounted) return

        const currentSignature = JSON.stringify(data)

        if (
          lastSignatureRef.current !== null &&
          lastSignatureRef.current !== currentSignature
        ) {
          lastSignatureRef.current = currentSignature
          window.dispatchEvent(
            new CustomEvent("project:diagram-updated", {
              detail: { proyectoId, remote: true },
            })
          )
        } else {
          lastSignatureRef.current = currentSignature
        }
      } catch {
        // Fallo silencioso de red sin interrumpir al usuario
      }
    }, POLLING_INTERVAL_MS)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [proyectoId])
}
