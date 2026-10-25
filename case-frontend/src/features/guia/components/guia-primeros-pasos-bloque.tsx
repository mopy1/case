import { useState } from "react"
import { cn } from "@/lib/utils"
import { useGuiaProgreso } from "../hooks/useGuiaProgreso"
import { GuiaPrimerosPasos } from "./guia-primeros-pasos"
import { GuiaPrimerosPasosResumen } from "./guia-primeros-pasos-resumen"

/**
 * Qué mostrar de "Primeros pasos" en el modo Guía (solo con la guía pendiente):
 * tarjeta completa con el hilo vacío o si el usuario la expandió; fila resumen si está colapsada o hay mensajes.
 */
export function GuiaPrimerosPasosBloque({ hiloVacio }: { hiloVacio: boolean }) {
  const { progreso, mostrar } = useGuiaProgreso()
  const [expandida, setExpandida] = useState(false)
  if (progreso.estado !== "pendiente") return null

  const completa = !progreso.colapsada && (expandida || hiloVacio)
  if (!completa) {
    return (
      <div className="px-3 pt-3">
        <GuiaPrimerosPasosResumen
          onMostrar={() => {
            mostrar()
            setExpandida(true)
          }}
        />
      </div>
    )
  }
  return (
    <div className={cn("flex flex-col px-3 pt-3", !hiloVacio && "max-h-[60%] shrink-0 overflow-y-auto border-b border-border pb-3")}>
      <GuiaPrimerosPasos />
    </div>
  )
}
