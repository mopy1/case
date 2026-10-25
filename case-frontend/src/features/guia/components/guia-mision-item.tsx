import { ArrowRight, ArrowUpRight, Circle, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { MisionDef } from "../types/guia.types"

interface GuiaMisionItemProps {
  mision: MisionDef
  hecha: boolean
  /** Primera pendiente: expandida con el único botón primario de la tarjeta. */
  proxima: boolean
  cargando: boolean
  onIr: (mision: MisionDef) => void
}

function Icono({ hecha, cargando }: { hecha: boolean; cargando: boolean }) {
  if (hecha) return <CircleCheck className="size-4 text-success" aria-hidden />
  if (cargando) return <Skeleton className="size-4 rounded-full" aria-hidden />
  return <Circle className="size-4 text-muted-foreground/60" aria-hidden />
}

export function GuiaMisionItem({ mision, hecha, proxima, cargando, onIr }: GuiaMisionItemProps) {
  return (
    <li className="flex gap-2.5 py-1">
      <span className="mt-0.5 shrink-0">
        <Icono hecha={hecha} cargando={cargando} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className={cn("flex-1 text-sm", hecha && "text-muted-foreground", proxima && "font-medium")}>
            {mision.titulo}
            {hecha && <span className="sr-only"> (hecho)</span>}
          </span>
          {!hecha && !proxima && (
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="ghost" size="icon-xs" aria-label={`Llevarme ahí: ${mision.titulo}`} onClick={() => onIr(mision)} />}
              >
                <ArrowUpRight />
              </TooltipTrigger>
              <TooltipContent side="left">Llevarme ahí</TooltipContent>
            </Tooltip>
          )}
        </div>
        {proxima && (
          <>
            <p className="text-xs text-muted-foreground">{mision.descripcion}</p>
            <Button size="xs" className="self-start" onClick={() => onIr(mision)}>
              Llevarme ahí <ArrowRight data-icon="inline-end" />
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
