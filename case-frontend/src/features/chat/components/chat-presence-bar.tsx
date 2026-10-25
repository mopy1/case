import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import type { EstadoConexionChat, UsuarioEnSala } from "../types/chat.types"

const MAX_AVATARES = 4

const ESTILO_ESTADO: Record<EstadoConexionChat, string> = {
  conectado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  conectando: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  reconectando: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  error: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
}

function textoEstado(estado: EstadoConexionChat, enLinea: number) {
  if (estado === "conectado") return `${enLinea} en línea`
  if (estado === "error") return "Sin tiempo real"
  return estado === "conectando" ? "Conectando…" : "Reconectando…"
}

interface ChatPresenceBarProps {
  usuarios: UsuarioEnSala[]
  estado: EstadoConexionChat
}

export function ChatPresenceBar({ usuarios, estado }: ChatPresenceBarProps) {
  const visibles = usuarios.slice(0, MAX_AVATARES)
  const resto = usuarios.slice(MAX_AVATARES)

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3 text-[11px] text-muted-foreground">
      <span className="shrink-0">En la sala:</span>
      <AvatarGroup>
        {visibles.map((u) => (
          <Tooltip key={u.usuarioId}>
            <TooltipTrigger render={<Avatar size="sm" />}>
              <AvatarFallback className={colorAvatar(u.usuarioId)}>{iniciales(u.username)}</AvatarFallback>
            </TooltipTrigger>
            <TooltipContent side="bottom">{u.username}</TooltipContent>
          </Tooltip>
        ))}
        {resto.length > 0 && (
          <Tooltip>
            <TooltipTrigger render={<AvatarGroupCount />}>+{resto.length}</TooltipTrigger>
            <TooltipContent side="bottom">{resto.map((u) => u.username).join(", ")}</TooltipContent>
          </Tooltip>
        )}
      </AvatarGroup>
      <Badge variant="outline" className={cn("ml-auto shrink-0 gap-1.5 text-[10px] font-medium", ESTILO_ESTADO[estado])}>
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
        {textoEstado(estado, usuarios.length)}
      </Badge>
    </div>
  )
}
