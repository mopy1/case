import { AtSign, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { MentionItem } from "../types/mention.types"

export interface ChatMentionsFilterProps {
  filtroActivo: string | null
  onCambiarFiltro: (filtro: string | null) => void
  totalMisMenciones: number
  candidatos: MentionItem[]
}

/**
 * Barra de filtrado superior por menciones: Todos, Mis menciones y selector por miembro.
 */
export function ChatMentionsFilter({
  filtroActivo,
  onCambiarFiltro,
  totalMisMenciones,
  candidatos,
}: ChatMentionsFilterProps) {
  const esMiembro = filtroActivo !== null && filtroActivo !== "yo"

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/70 bg-card/60 px-3 py-1.5 text-xs backdrop-blur-xs">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="xs"
          variant={filtroActivo === null ? "secondary" : "ghost"}
          onClick={() => onCambiarFiltro(null)}
          className={cn("h-6 rounded-md px-2 text-[11px]", filtroActivo === null && "bg-primary/10 font-semibold text-primary")}
        >
          Todos
        </Button>

        <Button
          type="button"
          size="xs"
          variant={filtroActivo === "yo" ? "secondary" : "ghost"}
          onClick={() => onCambiarFiltro(filtroActivo === "yo" ? null : "yo")}
          className={cn(
            "h-6 gap-1 rounded-md px-2 text-[11px]",
            filtroActivo === "yo" && "bg-amber-500/15 font-semibold text-amber-800 dark:text-amber-200"
          )}
        >
          <AtSign className="size-3 text-muted-foreground" />
          <span>Mis menciones</span>
          {totalMisMenciones > 0 && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/20 px-1 py-0 text-[9px] text-amber-700 dark:text-amber-300">
              {totalMisMenciones}
            </Badge>
          )}
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <select
          value={esMiembro ? filtroActivo : ""}
          onChange={(e) => onCambiarFiltro(e.target.value || null)}
          aria-label="Filtrar por miembro"
          className="h-6 rounded-md border border-border/60 bg-background px-1.5 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus:border-primary/60"
        >
          <option value="">@ Miembro…</option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.username}>
              @{c.username} {c.esIa ? "(IA)" : ""}
            </option>
          ))}
        </select>

        {filtroActivo !== null && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onCambiarFiltro(null)}
            title="Limpiar filtro"
            aria-label="Limpiar filtro"
            className="size-6 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
