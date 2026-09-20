import { Bot, RotateCcw, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CopilotSection } from "../types/copilot.types"

interface CopilotHeaderProps {
  section: CopilotSection
  onClear: () => void
  onClose: () => void
}

const SECTION_LABELS: Record<CopilotSection, string> = {
  diagrama: "Diagrama UML",
  tareas: "Tareas",
  notas: "Notas ADR",
  xmi: "XMI Interop",
  generador: "Generador Spring",
  general: "General",
}

export function CopilotHeader({ section, onClear, onClose }: CopilotHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="size-4" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">Copilot CASE</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium uppercase">
              {SECTION_LABELS[section] || section}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Manual Contextual & Arquitectura</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" onClick={onClear} />}>
            <RotateCcw className="size-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Reiniciar conversación</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" className="size-8" onClick={onClose} />}>
            <X className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Cerrar panel</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
