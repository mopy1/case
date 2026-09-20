import { useEffect, useState } from "react"
import { ViewportPortal, type Edge } from "@xyflow/react"
import { calcularSaltos, type Salto } from "../../lib/relationCrossing"

/** Marca visualmente dónde dos relaciones distintas se cruzan en el lienzo — sin esto, dos líneas
 * que se tocan en un punto que no es ninguna tabla se pueden confundir con una sola relación en
 * quiebre (2026-09-20, pedido explícito: "si 2 relaciones chocan, que se muestre como un
 * levantamiento para saber que no es una sola relación"). Convención de diagramas de circuitos:
 * la línea "de abajo" se corta un poquito y salta por encima con un arco chico, la otra queda
 * intacta. No conoce la geometría de las relaciones — muestrea el `<path>` real ya renderizado en
 * el DOM (`lib/relationCrossing.ts`), así funciona igual para una línea recta, con quiebres de 90°
 * o con puntos de control, sin duplicar esa lógica acá.
 *
 * **Bug real corregido (2026-09-20, reportado como "aparece la línea cortada cuando hay un
 * salto"):** la primera versión solo tapaba un tramo (`var(--background)`) y dibujaba el arco de
 * la línea que salta — pero las DOS líneas pasan exactamente por el mismo punto de cruce, así que
 * ese tapado le comía un pedazo a la línea que se suponía debía quedar intacta, y nunca se
 * reconstruía: quedaba con un corte real en el medio. Ahora se tapa con un CÍRCULO (cubre a las
 * dos sin depender del ángulo de cruce) y se reconstruye una a una: primero un segmento recto de
 * la línea "que pasa" (con su color/ancho reales, `getComputedStyle` — no una aproximación, ver
 * `tangenteYEstilo` en `lib/relationCrossing.ts`) y encima el arco de la línea "que salta".
 *
 * Recalcula en un `useEffect` después de cada render — un frame de retraso, imperceptible en la
 * práctica. Depende de `nodes` además de `edges` a propósito: arrastrar una tabla solo cambia
 * `nodes` (`edges` no cambia de referencia hasta el próximo refetch), así que sin `nodes` acá el
 * arco nunca se recalcularía en vivo mientras se arrastra — que es justo el caso más común. Mover
 * un punto de control, en cambio, es estado 100% local a `UmlRelationEdge` (`puntosLocal`) hasta
 * que se suelta — el arco recién se actualiza cuando se persiste y llega el refetch, no en cada
 * pixel del arrastre; aceptable, no se nota en la práctica. */
export function RelationCrossingOverlay({ edges, nodes }: { edges: Edge[]; nodes: unknown[] }) {
  const [saltos, setSaltos] = useState<Salto[]>([])

  useEffect(() => {
    const id = requestAnimationFrame(() => setSaltos(calcularSaltos(edges)))
    return () => cancelAnimationFrame(id)
  }, [edges, nodes])

  if (saltos.length === 0) return null

  return (
    <ViewportPortal>
      <svg className="pointer-events-none absolute top-0 left-0 overflow-visible">
        {saltos.map((salto, i) => {
          const largoReconstruccion = salto.radioBorrado * 1.6
          return (
            <g key={i}>
              <circle cx={salto.punto.x} cy={salto.punto.y} r={salto.radioBorrado} fill="var(--background)" />
              <line
                x1={salto.punto.x - salto.pasa.ux * largoReconstruccion}
                y1={salto.punto.y - salto.pasa.uy * largoReconstruccion}
                x2={salto.punto.x + salto.pasa.ux * largoReconstruccion}
                y2={salto.punto.y + salto.pasa.uy * largoReconstruccion}
                stroke={salto.pasa.color}
                strokeWidth={salto.pasa.ancho}
              />
              <path
                d={`M ${salto.punto.x - salto.cede.ux * salto.radio},${salto.punto.y - salto.cede.uy * salto.radio} A ${salto.radio},${salto.radio} 0 0 1 ${salto.punto.x + salto.cede.ux * salto.radio},${salto.punto.y + salto.cede.uy * salto.radio}`}
                fill="none"
                stroke={salto.cede.color}
                strokeWidth={salto.cede.ancho}
              />
            </g>
          )
        })}
      </svg>
    </ViewportPortal>
  )
}
