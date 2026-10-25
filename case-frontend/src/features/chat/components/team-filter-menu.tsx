import { AtSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MentionItem } from "../types/mention.types"

interface TeamFilterMenuProps {
  /** null = todos · "yo" = mis menciones · username = menciones a ese miembro. */
  filtro: string | null
  onFiltroChange: (filtro: string | null) => void
  totalMisMenciones: number
  candidatos: MentionItem[]
}

/** Menú de filtro por menciones (reemplaza la barra fija y el `<select>` nativo). */
export function TeamFilterMenu({ filtro, onFiltroChange, totalMisMenciones, candidatos }: TeamFilterMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant={filtro ? "secondary" : "ghost"} size="sm" aria-label="Filtrar mensajes por mención" className="gap-1 px-2" />}
      >
        <AtSign />
        {totalMisMenciones > 0 && <Badge variant="secondary">{totalMisMenciones}</Badge>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuRadioGroup value={filtro ?? ""} onValueChange={(v: string) => onFiltroChange(v || null)}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mostrar</DropdownMenuLabel>
            <DropdownMenuRadioItem closeOnClick value="">Todos los mensajes</DropdownMenuRadioItem>
            <DropdownMenuRadioItem closeOnClick value="yo">
              Mis menciones
              {totalMisMenciones > 0 && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{totalMisMenciones}</span>}
            </DropdownMenuRadioItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Menciones a…</DropdownMenuLabel>
            {candidatos.map((c) => (
              <DropdownMenuRadioItem closeOnClick key={c.id} value={c.username}>
                <span className="truncate">@{c.username}</span>
                {c.esIa && <Badge variant="secondary">IA</Badge>}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
