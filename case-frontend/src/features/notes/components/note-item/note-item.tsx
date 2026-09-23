import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { NotaResponse } from "../../types/notes.type"

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-BO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NoteItem({ nota, isLast }: { nota: NotaResponse; isLast: boolean }) {
  return (
    <div className="relative flex gap-3 pb-6">
      {!isLast && <span className="absolute top-8 bottom-0 left-[13px] w-px bg-border" />}
      <Avatar size="sm" className="shrink-0">
        <AvatarFallback>{(nota.username || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-2xl border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">
            <span className="font-medium">{nota.username || "Usuario"}</span> {nota.accion}
          </span>
          <span className="text-xs whitespace-nowrap text-muted-foreground">{formatFecha(nota.createdAt)}</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground italic">"{nota.motivo}"</p>
      </div>
    </div>
  )
}
