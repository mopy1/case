import type { ReactNode } from "react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"
import { usePanelResize } from "../hooks/usePanelResize"
import { usePanelTab } from "../hooks/usePanelTab"
import { CopilotModes } from "./copilot-modes"
import { CopilotPanelTabs } from "./copilot-panel-tabs"
import { PanelResizeHandle } from "./panel-resize-handle"

interface CopilotPanelProps {
  proyectoId: number
  isOpen: boolean
  onClose: () => void
  /** Contenido de la pestaña "Equipo" (chat grupal, `features/chat`). */
  teamPanel: ReactNode
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function CopilotPanel({
  proyectoId,
  isOpen,
  onClose,
  teamPanel,
  isFullscreen = false,
  onToggleFullscreen,
}: CopilotPanelProps) {
  const isMobile = useIsMobile()
  const resize = usePanelResize()
  const { width, isDragging } = resize
  const { tab, setTab } = usePanelTab()

  return (
    <>
      {/* Backdrop oscuro con blur en móviles cuando el drawer está abierto */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Panel de equipo y asistente IA"
        style={
          isMobile
            ? { height: "var(--visual-viewport-height, 100dvh)", maxHeight: "var(--visual-viewport-height, 100dvh)" }
            : isFullscreen
              ? undefined
              : { width: isOpen ? `${width}px` : 0 }
        }
        className={cn(
          "bg-card border-border",
          // Móvil: Drawer flotante adaptativo al teclado virtual que no empuja el layout
          "fixed top-0 right-0 z-50 flex flex-col w-full sm:max-w-[420px] md:max-w-none shadow-2xl transition-transform duration-200 ease-out overscroll-contain",
          isOpen ? "translate-x-0 border-l" : "translate-x-full pointer-events-none invisible",
          // Escritorio: Panel acoplado redimensionable o pantalla completa
          "md:relative md:top-auto md:right-auto md:inset-auto md:z-auto md:shadow-none md:translate-x-0 md:visible md:h-full md:shrink-0",
          isFullscreen
            ? "md:w-full md:flex-1 md:max-w-none md:border-l-0"
            : "md:w-auto",
          isDragging ? "md:select-none" : "md:transition-[width,opacity] md:duration-200 md:ease-out",
          isOpen
            ? "md:border-l md:opacity-100 md:pointer-events-auto"
            : "md:border-l-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
        )}
      >
        {/* Divisor solo en escritorio y con el panel acoplado */}
        {!isMobile && isOpen && !isFullscreen && <PanelResizeHandle {...resize} />}

        <CopilotPanelTabs
          tab={tab}
          onTabChange={setTab}
          onClose={onClose}
          teamPanel={teamPanel}
          copilotPanel={<CopilotModes proyectoId={proyectoId} />}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      </aside>
    </>
  )
}
