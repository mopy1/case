import { Trash2 } from "lucide-react"
import { useInternalNode, ViewportPortal } from "@xyflow/react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { construirRutaRelacion } from "../../lib/relationPath"
import type { AsociacionClase } from "../../hooks/useDiagramCanvas"

const ANCHO_NODO = 256
const ALTO_DEFAULT = 90

function medidas(node: ReturnType<typeof useInternalNode>) {
  if (!node) return null
  const { x, y } = node.internals.positionAbsolute
  const width = node.measured?.width ?? ANCHO_NODO
  const height = node.measured?.height ?? ALTO_DEFAULT
  return { x: x + width / 2, y: y + height / 2, width, height, topY: y }
}

/** Punto sobre el borde de `nodo` más cercano a `desde` — para que la línea entre justo al borde
 * de la tabla intermedia (arriba/abajo/al costado, según convenga) en vez de cruzar su cuerpo. */
function puntoDeEntrada(desde: { x: number; y: number }, nodo: NonNullable<ReturnType<typeof medidas>>) {
  const dx = desde.x - nodo.x
  const dy = desde.y - nodo.y
  if (Math.abs(dy) >= Math.abs(dx)) {
    return { x: nodo.x, y: dy < 0 ? nodo.topY : nodo.topY + nodo.height }
  }
  return { x: dx < 0 ? nodo.x - nodo.width / 2 : nodo.x + nodo.width / 2, y: nodo.y }
}

/** Una línea punteada de "clase de asociación" (UML): sale del punto medio de la relación N:M
 * hacia la tabla intermedia — no dos aristas sueltas tocando cada entidad. */
function AssociationClassLine({
  asociacion,
  onDelete,
  resaltada,
}: {
  asociacion: AsociacionClase
  onDelete: () => void
  resaltada: boolean
}) {
  const nodoOrigen = useInternalNode(String(asociacion.origenId))
  const nodoDestino = useInternalNode(String(asociacion.destinoId))
  const junction = medidas(useInternalNode(String(asociacion.junctionId)))

  if (!nodoOrigen || !nodoDestino || !junction) return null

  const esRecursiva = asociacion.origenId === asociacion.destinoId

  let medioX: number
  let medioY: number

  if (esRecursiva) {
    // N:M recursiva (origen y destino son la misma tabla): `UmlRelationEdge` dibuja esto con un
    // lazo rectangular manual que sale por arriba de la tarjeta, no con un "floating edge" (no
    // tiene sentido calcular una intersección contra el mismo rectángulo). Se replica la misma
    // fórmula para que el punteado arranque justo de la punta del lazo.
    const origen = medidas(nodoOrigen)!
    const sourceX = origen.x + origen.width / 2
    const sourceY = origen.y
    const targetX = origen.x - origen.width / 2
    const margen = 50
    medioX = (sourceX + targetX) / 2
    medioY = sourceY - origen.height / 2 - margen
  } else {
    // Misma función que usa `UmlRelationEdge` para trazar la línea N:M real, con los mismos
    // puntos de control (`asociacion.puntosControl`, viene de `mn.puntosControl` en
    // `detectarAsociacionesClase`) — así el punteado sigue la línea real si el usuario la "quebró"
    // a mano con Ctrl+arrastrar, en vez de recalcular un floating edge aparte que la ignoraba (bug
    // real corregido 2026-09-20, reportado: "cuando quiebro una relación... la relación intermedia
    // no sigue la relación que se rompió").
    const ruta = construirRutaRelacion(nodoOrigen, nodoDestino, asociacion.puntosControl)
    medioX = ruta.labelX
    medioY = ruta.labelY
  }

  const entrada = puntoDeEntrada({ x: medioX, y: medioY }, junction)
  // Un solo quiebre en ángulo recto (vertical y después horizontal) en vez de una diagonal que
  // atraviesa lo que sea que esté en el medio — misma línea de diseño que el resto de las
  // relaciones (ver `UmlRelationEdge`).
  const path = `M ${medioX},${medioY} L ${medioX},${entrada.y} L ${entrada.x},${entrada.y}`
  const botonX = medioX
  const botonY = (medioY + entrada.y) / 2

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke={resaltada ? "var(--primary)" : "var(--muted-foreground)"}
        strokeWidth={resaltada ? 2 : 1.5}
        strokeDasharray="5 4"
      />
      <foreignObject x={botonX - 10} y={botonY - 10} width={20} height={20} className="pointer-events-auto">
        <ConfirmDialog
          trigger={<Button variant="ghost" size="icon-xs" className="size-5 rounded-full border bg-card" />}
          title="¿Quitar la tabla intermedia de esta relación?"
          description="Se van a borrar las dos relaciones físicas hacia la tabla intermedia (la tabla en sí no se toca)."
          confirmLabel="Quitar"
          onConfirm={onDelete}
        >
          <Trash2 className="size-2.5" />
        </ConfirmDialog>
      </foreignObject>
    </>
  )
}

export function AssociationClassOverlay({
  asociaciones,
  onDelete,
  selectedEntidadId,
}: {
  asociaciones: AsociacionClase[]
  onDelete: (asociacion: AsociacionClase) => void
  selectedEntidadId: number | null
}) {
  if (asociaciones.length === 0) return null

  return (
    <ViewportPortal>
      <svg className="pointer-events-none absolute top-0 left-0 overflow-visible">
        {asociaciones.map((asociacion) => (
          <AssociationClassLine
            key={asociacion.id}
            asociacion={asociacion}
            onDelete={() => onDelete(asociacion)}
            resaltada={
              selectedEntidadId != null &&
              (selectedEntidadId === asociacion.origenId ||
                selectedEntidadId === asociacion.destinoId ||
                selectedEntidadId === asociacion.junctionId)
            }
          />
        ))}
      </svg>
    </ViewportPortal>
  )
}
