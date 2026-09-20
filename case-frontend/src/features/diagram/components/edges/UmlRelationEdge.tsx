import { memo } from "react"
import { BaseEdge, EdgeLabelRenderer, useInternalNode, useReactFlow, type EdgeProps, type Node } from "@xyflow/react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { construirRutaRelacion } from "../../lib/relationPath"
import { anchoLineaRelacion, colorLineaRelacion } from "../../lib/relationStyle"
import { usePuntosControlArrastre } from "../../hooks/usePuntosControlArrastre"
import { MultiplicidadBadge } from "./MultiplicidadBadge"
import { PuntoControlHandle } from "./PuntoControlHandle"
import type { LadoMultiplicidad, PuntoControl, RelacionDiagramaResponse } from "../../types/diagram.types"

/** Solo la línea + la multiplicidad entre paréntesis en cada punta (click para cambiarla). Sin
 * nada fijo en medio de la línea — al seleccionarla (click en el trazo) se resalta en rojo y
 * aparece un botón de borrar arriba del punto medio (con confirmación, mismo patrón que el resto
 * del proyecto); Supr/Backspace también borra directo, sin pasar por el botón. Línea simple, sin
 * flecha ni marcador en las puntas — la multiplicidad entre paréntesis es la única señal.
 *
 * **Puntos de control manuales (2026-09-20, pedido explícito: "quiero manipular las relaciones a
 * libertad... que pasen por otro lado, estorba cuando pasa por encima de otra tabla"):** la línea
 * es una polilínea recta entre floating edges (`lib/relationPath.ts`) que puede pasar por 0 o más
 * puntos intermedios arrastrables (`PuntoControlHandle`) — toda la lógica de arrastre vive en
 * `hooks/usePuntosControlArrastre.ts` (regla "Anti-1k-Lines" del proyecto), acá solo se conecta a
 * la línea/puntos que dibuja.
 */
export const UmlRelationEdge = memo(function UmlRelationEdge({
  selected,
  data,
}: EdgeProps & {

  data: {
    relacion: RelacionDiagramaResponse
    onEditOrigen: (lado: LadoMultiplicidad) => void
    onEditDestino: (lado: LadoMultiplicidad) => void
    onDelete: () => void
    onMoverPuntos: (puntos: PuntoControl[]) => void
    offsetParalelo: number
    resaltada?: boolean
  }
}) {
  const { relacion, onEditOrigen, onEditDestino, onDelete, onMoverPuntos, offsetParalelo, resaltada } = data
  const multOrigen = relacion.multiplicidadOrigen
  const multDestino = relacion.multiplicidadDestino
  const esRecursiva = relacion.entidadOrigenId === relacion.entidadDestinoId
  const nodoOrigen = useInternalNode<Node>(String(relacion.entidadOrigenId))
  const nodoDestino = useInternalNode<Node>(String(relacion.entidadDestinoId))
  const { screenToFlowPosition } = useReactFlow()

  const { puntosLocal, handlePointerDownPunto, handlePointerDownLinea } = usePuntosControlArrastre({
    puntosServidor: relacion.puntosControl,
    offsetParalelo,
    nodoOrigen,
    nodoDestino,
    onMoverPuntos,
    screenToFlowPosition,
  })

  if (!nodoOrigen || !nodoDestino) return null

  let edgePath: string
  let labelX: number
  let labelY: number
  let origenX: number
  let origenY: number
  let destinoX: number
  let destinoY: number

  if (esRecursiva) {
    // Relación recursiva (una tabla contra sí misma): un "floating edge" no tiene sentido acá
    // (origen y destino son el mismo rectángulo), así que tampoco tiene sentido la edición manual
    // de puntos. Lazo rectangular (solo líneas rectas, sin curvas) que sale del borde derecho, pasa
    // por ARRIBA de la tarjeta y entra por el izquierdo — usa la altura real medida del nodo para
    // no taparse con tablas más altas.
    const { x, y } = nodoOrigen.internals.positionAbsolute
    const ancho = nodoOrigen.measured?.width ?? 256
    const alto = nodoOrigen.measured?.height ?? 90
    const sourceX = x + ancho
    const sourceY = y + alto / 2
    const targetX = x
    const targetY = sourceY
    const margen = 50
    const loopY = sourceY - alto / 2 - margen
    const stub = 24
    edgePath = `M ${sourceX},${sourceY} L ${sourceX + stub},${sourceY} L ${sourceX + stub},${loopY} L ${targetX - stub},${loopY} L ${targetX - stub},${targetY} L ${targetX},${targetY}`
    labelX = (sourceX + targetX) / 2
    labelY = loopY
    origenX = sourceX + stub
    origenY = (sourceY + loopY) / 2
    destinoX = targetX - stub
    destinoY = (targetY + loopY) / 2
  } else {
    const ruta = construirRutaRelacion(nodoOrigen, nodoDestino, puntosLocal)
    edgePath = ruta.edgePath
    labelX = ruta.labelX
    labelY = ruta.labelY
    origenX = ruta.origenX
    origenY = ruta.origenY
    destinoX = ruta.destinoX
    destinoY = ruta.destinoY
  }

  // Mismo helper que usa `RelationCrossingOverlay` para el "salto" al cruzar otra relación — así
  // el arco pinta con el color/grosor real de esta línea, no uno aproximado.
  const estiloLinea = {
    stroke: colorLineaRelacion(selected, resaltada),
    strokeWidth: anchoLineaRelacion(selected, resaltada),
  }

  return (
    <>
      <BaseEdge path={edgePath} style={estiloLinea} />
      {!esRecursiva && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          className="cursor-crosshair"
          onPointerDown={handlePointerDownLinea}
        />
      )}
      <EdgeLabelRenderer>
        {selected && (
          <div
            className="nodrag nopan pointer-events-auto absolute"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 26}px)` }}
          >
            <ConfirmDialog
              trigger={
                <Button
                  variant="destructive"
                  size="icon-xs"
                  className="size-6 rounded-full border border-destructive/30 bg-destructive/10 shadow-sm"
                />
              }
              title="¿Eliminar esta relación?"
              description={`Se va a borrar la relación entre "${relacion.entidadOrigenNombre}" y "${relacion.entidadDestinoNombre}".`}
              confirmLabel="Eliminar relación"
              onConfirm={onDelete}
            >
              <Trash2 className="size-3" />
            </ConfirmDialog>
          </div>
        )}
        <MultiplicidadBadge valor={multOrigen} x={origenX} y={origenY} onSelect={onEditOrigen} />
        <MultiplicidadBadge valor={multDestino} x={destinoX} y={destinoY} onSelect={onEditDestino} />
        {!esRecursiva &&
          puntosLocal.map((punto, i) => (
            <PuntoControlHandle key={i} x={punto.x} y={punto.y} onPointerDown={(e) => handlePointerDownPunto(i, e)} />
          ))}
      </EdgeLabelRenderer>
    </>
  )
})

