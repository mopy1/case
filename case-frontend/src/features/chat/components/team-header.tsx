import { X } from "lucide-react"
import { ChatHeader } from "@/components/chat"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Marker, MarkerContent } from "@/components/ui/marker"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import type { EstadoConexionChat, UsuarioEnSala } from "../types/chat.types"
import type { MentionItem } from "../types/mention.types"
import { TeamFilterMenu } from "./team-filter-menu"

const MAX_AVATARES = 3
const PUNTO: Record<EstadoConexionChat, string> = {
  conectado: "bg-success",
  conectando: "bg-warning",
  reconectando: "bg-warning",
  error: "bg-destructive",
}

function textoEstado(estado: EstadoConexionChat, enLinea: number) {
  if (estado === "conectado") return `${enLinea} en línea`
  if (estado === "error") return "Sin tiempo real"
  return estado === "conectando" ? "Conectando…" : "Reconectando…"
}

interface TeamHeaderProps {
  usuarios: UsuarioEnSala[]
  estado: EstadoConexionChat
  filtro: string | null
  onFiltroChange: (filtro: string | null) => void
  totalMisMenciones: number
  totalFiltrados: number
  candidatos: MentionItem[]
}

/** Cabecera de la sala: presencia, estado del WebSocket y filtro de menciones. */
export function TeamHeader({ usuarios, estado, filtro, onFiltroChange, totalMisMenciones, totalFiltrados, candidatos }: TeamHeaderProps) {
  const resto = usuarios.slice(MAX_AVATARES)
  const presencia = (
    <AvatarGroup>
      {usuarios.slice(0, MAX_AVATARES).map((u) => (
        <Tooltip key={u.usuarioId}>
          <TooltipTrigger render={<Avatar size="sm" />}>
            <AvatarFallback className={cn("text-xs font-medium", colorAvatar(u.usuarioId))}>{iniciales(u.username)}</AvatarFallback>
          </TooltipTrigger>
          <TooltipContent side="bottom">{u.username}</TooltipContent>
        </Tooltip>
      ))}
      {resto.length > 0 && <AvatarGroupCount title={resto.map((u) => u.username).join(", ")}>+{resto.length}</AvatarGroupCount>}
    </AvatarGroup>
  )
  const quien = filtro === "yo" ? "vos" : `@${filtro}`

  return (
    <ChatHeader
      title="Sala del equipo"
      leading={usuarios.length > 0 ? presencia : undefined}
      description={
        <span className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", PUNTO[estado])} aria-hidden="true" />
          {textoEstado(estado, usuarios.length)}
        </span>
      }
      actions={<TeamFilterMenu filtro={filtro} onFiltroChange={onFiltroChange} totalMisMenciones={totalMisMenciones} candidatos={candidatos} />}
      banner={
        filtro && (
          <Marker className="text-xs">
            <MarkerContent className="flex-1">
              Mostrando menciones a {quien} · {totalFiltrados}
            </MarkerContent>
            <Button variant="ghost" size="xs" onClick={() => onFiltroChange(null)}>
              <X data-icon="inline-start" /> Quitar filtro
            </Button>
          </Marker>
        )
      }
    />
  )
}
