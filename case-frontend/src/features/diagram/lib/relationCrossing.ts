import type { Edge } from "@xyflow/react"

/** Geometría pura para detectar dónde se cruzan dos relaciones distintas en el lienzo — extraído
 * de `RelationCrossingOverlay.tsx` (regla "Anti-1k-Lines" del proyecto). */

export interface Punto {
  x: number
  y: number
}

export interface LineaEnCruce {
  color: string
  ancho: number
  ux: number
  uy: number
}

export interface Salto {
  punto: Punto
  radio: number
  radioBorrado: number
  cede: LineaEnCruce
  pasa: LineaEnCruce
}

/** Muestrea el `<path>` real ya dibujado en el DOM cada `pasoPx` — funciona para cualquier forma
 * (recta, con quiebres de 90°, con puntos de control) sin tener que conocer su geometría interna,
 * a costa de tener que leerlo después de pintado (por eso el cálculo vive en un `useEffect`, no
 * en el render). */
function muestrearPath(path: SVGPathElement, pasoPx = 6): Punto[] {
  const total = path.getTotalLength()
  if (total < pasoPx) return []
  const n = Math.min(400, Math.round(total / pasoPx))
  const puntos: Punto[] = []
  for (let i = 0; i <= n; i++) {
    const p = path.getPointAtLength((i / n) * total)
    puntos.push({ x: p.x, y: p.y })
  }
  return puntos
}

function interseccionDeSegmentos(p1: Punto, p2: Punto, p3: Punto, p4: Punto): Punto | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x)
  if (Math.abs(d) < 1e-9) return null
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d
  if (t < 0 || t > 1 || u < 0 || u > 1) return null
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) }
}

/** Recorta el `10%` de cada punta de la muestra — ahí es donde la línea toca su propia tabla, no
 * tiene sentido marcar eso como un "cruce" con otra relación que llegue a la misma zona. */
function recortarPuntas<T>(puntos: T[]): T[] {
  const margen = Math.floor(puntos.length * 0.1)
  return puntos.slice(margen, puntos.length - margen)
}

/** Ángulo de avance en `puntos[indice]` — mirando al punto siguiente (o al anterior si `indice`
 * ya es el último de la muestra). Usa el estilo REAL ya renderizado (`getComputedStyle`), no una
 * aproximación — necesario para que el parche/reconstrucción de `RelationCrossingOverlay` cubra
 * exactamente el ancho real de la línea (una aproximación de menos dejaba ver un borde de la línea
 * vieja asomando, el "bug visual" de la línea cortada que se reportó). */
function tangenteYEstilo(muestra: { puntos: Punto[]; el: SVGPathElement }, indice: number): LineaEnCruce {
  const siguiente = muestra.puntos[Math.min(indice + 1, muestra.puntos.length - 1)]
  const actual = muestra.puntos[indice]
  const dx = siguiente.x - actual.x
  const dy = siguiente.y - actual.y
  const largo = Math.hypot(dx, dy) || 1
  const computado = getComputedStyle(muestra.el)
  return {
    ux: dx / largo,
    uy: dy / largo,
    color: computado.stroke || "var(--muted-foreground)",
    ancho: parseFloat(computado.strokeWidth) || 1.5,
  }
}

export function calcularSaltos(edges: Edge[]): Salto[] {
  const muestras = edges
    .map((edge) => {
      const el = document.querySelector<SVGPathElement>(
        `[data-testid="rf__edge-${edge.id}"] path.react-flow__edge-path`
      )
      if (!el) return null
      const puntos = recortarPuntas(muestrearPath(el))
      if (puntos.length < 2) return null
      return { edge, puntos, el }
    })
    .filter((m): m is { edge: Edge; puntos: Punto[]; el: SVGPathElement } => m !== null)

  const saltos: Salto[] = []
  const radio = 8

  for (let i = 0; i < muestras.length; i++) {
    for (let j = i + 1; j < muestras.length; j++) {
      const [m1, m2] = [muestras[i], muestras[j]]
      // La que "salta" es siempre la de id numéricamente mayor — determinístico, no depende del
      // orden de iteración ni de cuál se dibujó encima.
      const cedeEsM1 = Number(m1.edge.id) > Number(m2.edge.id)

      busquedaCruce: for (let a = 0; a < m1.puntos.length - 1; a++) {
        for (let b = 0; b < m2.puntos.length - 1; b++) {
          const punto = interseccionDeSegmentos(m1.puntos[a], m1.puntos[a + 1], m2.puntos[b], m2.puntos[b + 1])
          if (!punto) continue
          const cede = tangenteYEstilo(cedeEsM1 ? m1 : m2, cedeEsM1 ? a : b)
          const pasa = tangenteYEstilo(cedeEsM1 ? m2 : m1, cedeEsM1 ? b : a)
          saltos.push({
            punto,
            radio,
            // Círculo (no un rectángulo alineado a una sola línea) — cubre las dos sin importar
            // en qué ángulo se crucen; el `+2` es margen extra para no dejar bordes asomando.
            radioBorrado: radio + Math.max(cede.ancho, pasa.ancho) / 2 + 2,
            cede,
            pasa,
          })
          break busquedaCruce
        }
      }
    }
  }
  return saltos
}
