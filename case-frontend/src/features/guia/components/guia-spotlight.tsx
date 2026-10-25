import { useRef } from "react"
import { Popover } from "@base-ui/react/popover"
import { Button } from "@/components/ui/button"
import { useGuiaSpotlight } from "../hooks/useGuiaSpotlight"

/** Coach mark sin overlay: el anillo lo pone `[data-guia-activo]` (index.css) y este popover no modal explica el botón. */
export function GuiaSpotlight() {
  const { paso, elemento, indice, total, siguiente, cerrar } = useGuiaSpotlight()
  const siguienteRef = useRef<HTMLButtonElement>(null)
  if (!paso || !elemento) return null
  const ultimo = indice + 1 >= total

  return (
    <Popover.Root open modal={false} onOpenChange={(abierto) => !abierto && cerrar()}>
      <Popover.Portal>
        <Popover.Positioner anchor={elemento} side={paso.lado} sideOffset={8} collisionPadding={12} className="isolate z-50">
          <Popover.Popup
            initialFocus={siguienteRef}
            finalFocus={() => elemento}
            className="flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-1.5 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none"
          >
            <Popover.Title className="text-sm font-medium">{paso.titulo}</Popover.Title>
            <Popover.Description className="text-sm text-muted-foreground">{paso.texto}</Popover.Description>
            <div className="mt-1 flex items-center gap-1.5">
              {total > 1 && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {indice + 1} de {total}
                </span>
              )}
              <span className="flex-1" />
              <Button variant="ghost" size="xs" onClick={cerrar}>
                Cerrar
              </Button>
              <Button ref={siguienteRef} size="xs" onClick={siguiente}>
                {ultimo ? "Entendido" : "Siguiente"}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
