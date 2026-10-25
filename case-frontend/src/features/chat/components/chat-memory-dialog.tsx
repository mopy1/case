import { useState } from "react"
import { Brain } from "lucide-react"
import { ChatError, MessageMarkdown, etiquetaDia, horaCorta } from "@/components/chat"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useChatMemoria } from "../hooks/useChatMemoria"

function Cuerpo({ estado }: { estado: ReturnType<typeof useChatMemoria> }) {
  const { memoria, loading, error, recargar } = estado
  if (loading || (!memoria && !error)) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label="Cargando memoria">
        {["w-full", "w-11/12", "w-4/5", "w-2/3"].map((w) => <Skeleton key={w} className={`h-4 ${w}`} />)}
      </div>
    )
  }
  if (error) return <ChatError title="No se pudo cargar la memoria" message={error} onRetry={() => void recargar()} />
  if (!memoria?.resumen) {
    return (
      <Empty className="border border-dashed p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Brain />
          </EmptyMedia>
          <EmptyTitle>Todavía no hay memoria</EmptyTitle>
          <EmptyDescription>
            La memoria se genera cuando la sala supera unos 50 mensajes y alguien menciona a @SeniorDev. Mientras tanto, Senior Dev
            busca en el historial completo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
        <MessageMarkdown text={memoria.resumen} />
      </div>
      {memoria.updatedAt && (
        <p className="text-xs text-muted-foreground">
          Actualizada {etiquetaDia(memoria.updatedAt).toLowerCase()} a las {horaCorta(memoria.updatedAt)}
          {memoria.ultimoMensajeResumidoId && ` · cubre hasta el mensaje #${memoria.ultimoMensajeResumidoId}`}
        </p>
      )}
    </div>
  )
}

/** Botón "Memoria" de la cabecera + diálogo con el resumen acumulado que usa Senior Dev (carga al abrir). */
export function ChatMemoryDialog({ proyectoId }: { proyectoId: number }) {
  const [open, setOpen] = useState(false)
  const estado = useChatMemoria(proyectoId)

  function cambiar(abierto: boolean) {
    setOpen(abierto)
    if (abierto) void estado.recargar()
  }

  return (
    <Dialog open={open} onOpenChange={cambiar}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Memoria del equipo" onClick={() => cambiar(true)} />}>
          <Brain />
        </TooltipTrigger>
        <TooltipContent side="bottom">Memoria del equipo</TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Memoria del equipo</DialogTitle>
          <DialogDescription>Resumen de los mensajes viejos que Senior Dev tiene en cuenta al responder.</DialogDescription>
        </DialogHeader>
        <Cuerpo estado={estado} />
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
