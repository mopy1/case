import { Handle, Position } from "@xyflow/react"
import { Circle, KeyRound, Link2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "../../types/diagram.types"

function FilaAtributo({ atributo, zebra }: { atributo: AtributoEntidadResponse; zebra: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs", zebra && "bg-muted/30")}>
      <div className="flex min-w-0 items-center gap-1.5">
        {atributo.esPk && (
          <Tooltip>
            <TooltipTrigger className="flex shrink-0 items-center">
              <KeyRound className="size-3 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>Clave primaria</TooltipContent>
          </Tooltip>
        )}
        {atributo.esFk && (
          <Tooltip>
            <TooltipTrigger className="flex shrink-0 items-center">
              <Link2 className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              Llave foránea{atributo.referenciaEntidadNombre ? ` → ${atributo.referenciaEntidadNombre}` : ""}
            </TooltipContent>
          </Tooltip>
        )}
        <span className="truncate" title={atributo.nombre}>
          {atributo.nombre}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="truncate font-mono text-muted-foreground" title={atributo.tipoSql}>
          {atributo.tipoSql}
        </span>
        <Tooltip>
          <TooltipTrigger className="flex items-center">
            <Circle className={cn("size-2.5 text-muted-foreground/70", !atributo.nullable && "fill-current")} />
          </TooltipTrigger>
          <TooltipContent>{atributo.nullable ? "Admite NULL" : "Obligatorio (NOT NULL)"}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

export function EntityNode({
  data,
  selected,
}: {
  data: { entidad: EntidadDiagramaResponse; onDelete: () => void; esTablaIntermedia: boolean }
  selected?: boolean
}) {
  const { entidad, onDelete, esTablaIntermedia } = data
  // Las PK van agrupadas arriba, separadas del resto — así se lee la estructura de un vistazo,
  // como en cualquier herramienta de diagramas de base de datos.
  const pk = entidad.atributos.filter((a) => a.esPk)
  const resto = entidad.atributos.filter((a) => !a.esPk)

  return (
    <div
      className={cn(
        "w-64 rounded-2xl border bg-card shadow-md",
        selected ? "border-primary ring-2 ring-primary/40" : esTablaIntermedia ? "border-dashed border-border" : "border-border"
      )}
    >
      {/* 4 puntos de conexión (uno por lado) en vez de solo izquierda/derecha — la arista
      custom (`UmlRelationEdge`) recalcula sola cuál usar según dónde esté la otra tabla
      (ver `lib/floatingEdge.ts`), así que estos 4 solo necesitan existir para poder arrastrar
      una conexión nueva desde cualquier lado; no importa cuál se use en particular. */}
      <Handle type="source" position={Position.Top} id="top" />
      <Handle type="source" position={Position.Right} id="right" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Left} id="left" />
      <div className="flex items-center justify-between gap-2 rounded-t-2xl border-b bg-muted/40 px-3 py-2">
        <span className="truncate text-sm font-semibold" title={entidad.nombre}>
          {entidad.nombre}
        </span>
        <div className="flex items-center gap-1.5">
          {esTablaIntermedia && (
            <Tooltip>
              <TooltipTrigger>
                <span className="rounded-full border border-dashed px-1.5 py-0 text-[9px] font-medium tracking-wide text-muted-foreground uppercase">
                  auto
                </span>
              </TooltipTrigger>
              <TooltipContent>Tabla intermedia generada sola por una relación N:M</TooltipContent>
            </Tooltip>
          )}
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Table</span>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon-xs" className="nodrag" />}
            title="¿Eliminar esta tabla?"
            description={`Se va a borrar "${entidad.nombre}" de forma permanente.`}
            confirmLabel="Eliminar tabla"
            onConfirm={onDelete}
          >
            <Trash2 className="size-3" />
          </ConfirmDialog>
        </div>
      </div>
      <div className="px-2 py-1.5">
        {entidad.atributos.length === 0 ? (
          <p className="px-1 py-1 text-xs text-muted-foreground">Sin atributos todavía</p>
        ) : (
          <div className="flex flex-col">
            {pk.map((atributo, i) => (
              <FilaAtributo key={atributo.id} atributo={atributo} zebra={i % 2 === 1} />
            ))}
            {pk.length > 0 && resto.length > 0 && <Separator className="my-1" />}
            {resto.map((atributo, i) => (
              <FilaAtributo key={atributo.id} atributo={atributo} zebra={i % 2 === 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
