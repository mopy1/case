import { memo } from "react"
import { BaseEdge, EdgeLabelRenderer, useInternalNode, useReactFlow, type EdgeProps, type Node } from "@xyflow/react"
import { construirRutaRelacion } from "../../lib/relationPath"
import { anchoLineaRelacion, colorLineaRelacion } from "../../lib/relationStyle"
import { usePuntosControlArrastre } from "../../hooks/usePuntosControlArrastre"
import { MultiplicidadBadge } from "./MultiplicidadBadge"
import { PuntoControlHandle } from "./PuntoControlHandle"
import { UmlRelationToolbar } from "./UmlRelationToolbar"
import type { LadoMultiplicidad, PuntoControl, RelacionDiagramaResponse, TipoRelacionUml } from "../../types/diagram.types"

export const UmlRelationEdge = memo(function UmlRelationEdge({
  selected,
  data,
}: EdgeProps & {
  data: {
    relacion: RelacionDiagramaResponse
    onEditOrigen: (lado: LadoMultiplicidad) => void
    onEditDestino: (lado: LadoMultiplicidad) => void
    onEditTipo?: (tipo: TipoRelacionUml) => void
    onDelete: () => void
    onMoverPuntos: (puntos: PuntoControl[]) => void
    offsetParalelo: number
    resaltada?: boolean
  }
}) {
  const { relacion, onEditOrigen, onEditDestino, onEditTipo, onDelete, onMoverPuntos, offsetParalelo, resaltada } = data
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

  const estiloLinea = {
    stroke: colorLineaRelacion(selected, resaltada),
    strokeWidth: anchoLineaRelacion(selected, resaltada),
  }

  const tipo = relacion.tipo || "ASOCIACION"
  const markerStart =
    tipo === "COMPOSICION"
      ? "url(#uml-marker-composition)"
      : tipo === "AGREGACION"
      ? "url(#uml-marker-aggregation)"
      : undefined
  const markerEnd = tipo === "HERENCIA" ? "url(#uml-marker-inheritance)" : undefined

  return (
    <>
      <BaseEdge path={edgePath} style={estiloLinea} markerStart={markerStart} markerEnd={markerEnd} />
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
        {selected ? (
          <UmlRelationToolbar
            relacion={relacion}
            labelX={labelX}
            labelY={labelY}
            onDelete={onDelete}
            onEditTipo={onEditTipo}
          />
        ) : (
          tipo !== "ASOCIACION" && (
            <div
              className="nodrag nopan pointer-events-none absolute select-none rounded-full border border-border/60 bg-card/90 px-1.5 py-0.5 text-[9px] font-semibold text-foreground/80 shadow-xs"
              style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            >
              {tipo === "COMPOSICION" ? "◆ Comp" : tipo === "AGREGACION" ? "◇ Agreg" : "▷ Herencia"}
            </div>
          )
        )}
        <MultiplicidadBadge valor={relacion.multiplicidadOrigen} x={origenX} y={origenY} onSelect={onEditOrigen} />
        <MultiplicidadBadge valor={relacion.multiplicidadDestino} x={destinoX} y={destinoY} onSelect={onEditDestino} />
        {!esRecursiva &&
          puntosLocal.map((punto, i) => (
            <PuntoControlHandle key={i} x={punto.x} y={punto.y} onPointerDown={(e) => handlePointerDownPunto(i, e)} />
          ))}
      </EdgeLabelRenderer>
    </>
  )
})
