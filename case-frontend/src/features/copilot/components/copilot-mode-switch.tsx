import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CopilotModoVista } from "../hooks/useCopilotModo"

interface CopilotModeSwitchProps {
  modo: CopilotModoVista
  onChange: (modo: CopilotModoVista) => void
}

/** Interruptor segmentado "Asistente · Guía" (va primero en las acciones de las dos cabeceras). */
export function CopilotModeSwitch({ modo, onChange }: CopilotModeSwitchProps) {
  return (
    <Tabs value={modo} onValueChange={(v) => onChange(v === "guia" ? "guia" : "asistente")} className="gap-0">
      <TabsList aria-label="Modo del Copilot" data-guia="copilot-modo" className="group-data-horizontal/tabs:h-7 p-0.5">
        <TabsTrigger value="asistente" className="px-2 text-xs">
          Asistente
        </TabsTrigger>
        <TabsTrigger value="guia" className="px-2 text-xs">
          Guía
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
