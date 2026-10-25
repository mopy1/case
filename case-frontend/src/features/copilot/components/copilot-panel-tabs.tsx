import type { ReactNode } from "react"
import { Bot, Maximize2, Minimize2, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PanelTab } from "../hooks/usePanelTab"

interface CopilotPanelTabsProps {
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  onClose: () => void
  teamPanel: ReactNode
  copilotPanel: ReactNode
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

// keepMounted en ambas: el historial del Copilot vive en memoria y el WS del chat no debe cortarse.
const PANEL_CLASS = "flex min-h-0 flex-1 flex-col text-base"

export function CopilotPanelTabs({
  tab,
  onTabChange,
  onClose,
  teamPanel,
  copilotPanel,
  isFullscreen = false,
  onToggleFullscreen,
}: CopilotPanelTabsProps) {
  return (
    <Tabs
      value={tab}
      onValueChange={(valor) => onTabChange(valor === "copilot" ? "copilot" : "equipo")}
      className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden"
    >
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border px-2">
        <TabsList variant="line" className="h-full flex-1 justify-start">
          <TabsTrigger value="equipo" className="flex-none px-3 text-xs">
            <Users /> Equipo
          </TabsTrigger>
          <TabsTrigger value="copilot" className="flex-none px-3 text-xs">
            <Bot /> Copilot
          </TabsTrigger>
        </TabsList>

        {onToggleFullscreen && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden size-7 rounded-lg text-foreground/80 hover:text-foreground md:inline-flex"
                  onClick={onToggleFullscreen}
                  aria-label={isFullscreen ? "Restaurar panel acoplado" : "Maximizar a pantalla completa"}
                />
              }
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isFullscreen ? "Restaurar tamaño acoplado" : "Maximizar a pantalla completa"}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg text-foreground/80 hover:text-foreground sm:size-7"
                onClick={onClose}
                aria-label="Cerrar panel"
              />
            }
          >
            <X className="size-5 sm:size-4" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Cerrar panel</TooltipContent>
        </Tooltip>
      </div>

      <TabsContent value="equipo" keepMounted className={PANEL_CLASS}>
        {teamPanel}
      </TabsContent>
      <TabsContent value="copilot" keepMounted className={PANEL_CLASS}>
        {copilotPanel}
      </TabsContent>
    </Tabs>
  )
}
