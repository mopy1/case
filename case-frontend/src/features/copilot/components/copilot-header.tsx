import { Bot, RotateCcw, X, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CopilotSection } from "../types/copilot.types"

interface CopilotHeaderProps {
  section: CopilotSection
  autoMode: boolean
  onToggleAutoMode: () => void
  onClear: () => void
  /** Opcional: dentro del panel con pestañas el cierre vive en la fila de pestañas. */
  onClose?: () => void
}

const SECTION_LABELS: Record<CopilotSection, string> = {
  diagrama: "Diagrama",
  tareas: "Tareas",
  notas: "Notas",
  xmi: "XMI",
  generador: "Generador",
  general: "General",
}

export function CopilotHeader({
  section,
  autoMode,
  onToggleAutoMode,
  onClear,
  onClose,
}: CopilotHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold tracking-tight text-foreground">Copilot</span>
            <Badge variant="secondary" className="px-1 py-0 text-[9px] font-medium uppercase">
              {SECTION_LABELS[section] || section}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground">Asistente Autónomo</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={autoMode ? "default" : "outline"}
                size="sm"
                className={`h-7 px-2 gap-1 text-[11px] font-semibold transition-all ${
                  autoMode
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs border-amber-500"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={onToggleAutoMode}
              />
            }
          >
            <Zap className={`size-3 ${autoMode ? "fill-current" : ""}`} />
            <span>{autoMode ? "Autónomo" : "Manual"}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px] text-center text-xs">
            {autoMode
              ? "⚡ Modo Autónomo ACTIVO: Las acciones se aplican directamente en el lienzo sin pedir confirmación."
              : "Activar Modo Autónomo para aplicar cambios y tablas al instante sin clics manuales."}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 sm:size-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={onClear}
                aria-label="Reiniciar conversación"
              />
            }
          >
            <RotateCcw className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Reiniciar conversación</TooltipContent>
        </Tooltip>

        {onClose && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 sm:size-7 flex items-center justify-center rounded-lg hover:bg-muted text-foreground/80 hover:text-foreground cursor-pointer"
                  onClick={onClose}
                  aria-label="Cerrar panel Copilot"
                />
              }
            >
              <X className="size-5 sm:size-4 text-foreground/80 hover:text-foreground" />
            </TooltipTrigger>
            <TooltipContent side="bottom">Cerrar panel</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  )
}
