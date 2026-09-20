import { memo } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { OPCIONES_LADO, etiquetaLado } from "../../lib/multiplicidad"
import type { LadoMultiplicidad } from "../../types/diagram.types"

/** El texto entre paréntesis ("(1)", "(1..*)", etc.) en cada punta de una relación — click abre un
 * `DropdownMenu` con las 4 multiplicidades posibles, solo para ese lado. Extraído de
 * `UmlRelationEdge.tsx` (regla "Anti-1k-Lines" del proyecto) — se usa 2 veces ahí (origen/destino). */
export const MultiplicidadBadge = memo(function MultiplicidadBadge({
  valor,
  x,
  y,
  onSelect,
}: {
  valor: LadoMultiplicidad
  x: number
  y: number
  onSelect: (lado: LadoMultiplicidad) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title="Click para cambiar la multiplicidad de este lado"
        className="nodrag nopan pointer-events-auto absolute rounded bg-card px-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
        style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
      >
        ({etiquetaLado(valor)})
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {OPCIONES_LADO.map((opcion) => (
          <DropdownMenuItem key={opcion.value} onClick={() => onSelect(opcion.value)}>
            {opcion.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
