import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import type { RelacionDiagramaResponse, TipoRelacionUml } from "../../types/diagram.types"

interface UmlRelationToolbarProps {
  relacion: RelacionDiagramaResponse
  labelX: number
  labelY: number
  onDelete: () => void
  onEditTipo?: (tipo: TipoRelacionUml) => void
}

const TIPOS_CONFIG: { tipo: TipoRelacionUml; label: string; icon: string; title: string }[] = [
  { tipo: "ASOCIACION", label: "Asoc", icon: "─", title: "Asociación simple" },
  { tipo: "COMPOSICION", label: "Comp", icon: "◆", title: "Composición (rombo relleno)" },
  { tipo: "AGREGACION", label: "Agreg", icon: "◇", title: "Agregación (rombo hueco)" },
  { tipo: "HERENCIA", label: "Heren", icon: "▷", title: "Herencia / Generalización" },
]

export function UmlRelationToolbar({
  relacion,
  labelX,
  labelY,
  onDelete,
  onEditTipo,
}: UmlRelationToolbarProps) {
  const tipoActual = relacion.tipo || "ASOCIACION"

  return (
    <div
      className="nodrag nopan pointer-events-auto absolute flex items-center gap-1 rounded-full border border-border/80 bg-card/95 px-1.5 py-1 shadow-lg backdrop-blur-sm z-30"
      style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 32}px)` }}
    >
      <div className="flex items-center gap-0.5">
        {TIPOS_CONFIG.map(({ tipo, icon, title }) => {
          const isActive = tipoActual === tipo
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onEditTipo?.(tipo)}
              title={title}
              className={`flex items-center justify-center size-6 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{icon}</span>
            </button>
          )
        })}
      </div>

      <div className="h-3.5 w-px bg-border/80 mx-0.5" />

      <ConfirmDialog
        trigger={
          <Button
            variant="destructive"
            size="icon-xs"
            title="Eliminar relación"
            className="size-6 rounded-full border border-destructive/30 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground shadow-xs cursor-pointer"
          >
            <Trash2 className="size-3" />
          </Button>
        }
        title="¿Eliminar esta relación?"
        description={`Se va a borrar la relación entre "${relacion.entidadOrigenNombre}" y "${relacion.entidadDestinoNombre}".`}
        confirmLabel="Eliminar relación"
        onConfirm={onDelete}
      />
    </div>
  )
}
