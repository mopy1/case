import { memo } from "react"

/**
 * El círculo arrastrable de un punto de control manual — presentacional puro, toda la lógica de
 * arrastre/borrado vive en `UmlRelationEdge` (que ya sabe si el gesto fue un click o un drag real,
 * necesario para decidir si Ctrl+click borra el punto o si fue un arrastre que hay que persistir).
 * Área de agarre más grande que el círculo visible (`size-5` invisible alrededor de un punto
 * `size-2.5`) — un hit-target del tamaño del círculo real era muy chico para agarrar con el mouse
 * de forma confiable.
 */
export const PuntoControlHandle = memo(function PuntoControlHandle({
  x,
  y,
  onPointerDown,
}: {
  x: number
  y: number
  onPointerDown: (e: React.PointerEvent) => void
}) {
  return (
    <div
      className="nodrag nopan pointer-events-auto absolute flex size-5 cursor-move items-center justify-center"
      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
      onPointerDown={onPointerDown}
      title="Arrastrar para mover · Ctrl+click para quitar"
    >
      <div className="size-2.5 rounded-full border-2 border-background bg-primary shadow" />
    </div>
  )
})
