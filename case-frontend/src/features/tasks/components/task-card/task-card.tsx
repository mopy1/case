import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { cn } from "@/lib/utils"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { ESTADOS_ORDEN, ESTADO_LABEL } from "./task-card.data"
import type { TareaResponse } from "../../types/tasks.type"

const PRIORIDAD_VARIANT = {
  ALTA: "destructive",
  MEDIA: "secondary",
  BAJA: "outline",
} as const

export function TaskCard({
  tarea,
  onChangeEstado,
  onDelete,
}: {
  tarea: TareaResponse
  onChangeEstado: (estado: (typeof ESTADOS_ORDEN)[number]) => void
  onDelete: () => void | Promise<void>
}) {
  const index = ESTADOS_ORDEN.indexOf(tarea.estado)
  const puedeRetroceder = index > 0
  const puedeAvanzar = index < ESTADOS_ORDEN.length - 1

  return (
    <Card size="sm" className="relative w-full overflow-visible pb-3">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm">{tarea.titulo}</CardTitle>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon-xs" />}
            title="¿Eliminar esta tarea?"
            description={`Se va a borrar "${tarea.titulo}" de forma permanente.`}
            confirmLabel="Eliminar tarea"
            onConfirm={onDelete}
          >
            <Trash2 />
          </ConfirmDialog>
        </div>
        {tarea.descripcion && <CardDescription className="line-clamp-2 text-xs">{tarea.descripcion}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Badge variant={PRIORIDAD_VARIANT[tarea.prioridad]}>{tarea.prioridad}</Badge>
      </CardContent>
      <CardFooter className={cn("items-center justify-between", tarea.usuarioUsername && "pr-8")}>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!puedeRetroceder}
          onClick={() => onChangeEstado(ESTADOS_ORDEN[index - 1])}
        >
          <ChevronLeft />
        </Button>
        <span className="text-xs text-muted-foreground">{ESTADO_LABEL[tarea.estado]}</span>
        <Button
          variant="outline"
          size="icon-xs"
          disabled={!puedeAvanzar}
          onClick={() => onChangeEstado(ESTADOS_ORDEN[index + 1])}
        >
          <ChevronRight />
        </Button>
      </CardFooter>
      {tarea.usuarioUsername && (
        <Avatar size="sm" className="absolute -right-2 -bottom-2 ring-2 ring-background">
          <AvatarFallback className={colorAvatar(tarea.usuarioId ?? tarea.usuarioUsername)}>
            {iniciales(tarea.usuarioUsername)}
          </AvatarFallback>
        </Avatar>
      )}
    </Card>
  )
}
