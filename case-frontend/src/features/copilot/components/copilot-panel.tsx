import type { ReactNode } from "react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { cn } from "@/lib/utils"
import { usePanelResize } from "../hooks/usePanelResize"
import { usePanelTab } from "../hooks/usePanelTab"
import { CopilotAssistantView } from "./copilot-assistant-view"
import { CopilotPanelTabs } from "./copilot-panel-tabs"

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
  const { width, isDragging, setIsDragging, resetWidth } = usePanelResize()
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
          "fixed top-0 right-0 z-50 flex flex-col w-full sm:max-w-[380px] shadow-2xl transition-transform duration-200 ease-out overscroll-contain",
          isOpen ? "translate-x-0 border-l" : "translate-x-full pointer-events-none invisible",
          // Escritorio: Panel acoplado redimensionable o pantalla completa
          "md:relative md:top-auto md:right-auto md:inset-auto md:z-auto md:shadow-xl md:translate-x-0 md:visible md:h-full md:shrink-0",
          isFullscreen
            ? "md:w-full md:flex-1 md:max-w-none md:border-l-0"
            : "md:w-auto",
          isDragging ? "md:select-none" : "md:transition-[width,opacity] md:duration-200 md:ease-out",
          isOpen
            ? "md:border-l md:opacity-100 md:pointer-events-auto"
            : "md:border-l-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
        )}
      >
        {/* Resize handle exclusivo para pantallas de escritorio cuando no está en pantalla completa */}
        {!isMobile && isOpen && !isFullscreen && (
          <div
            role="separator"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDoubleClick={resetWidth}
            title="Arrastra para redimensionar el panel (Doble clic para restablecer)"
            className="group absolute -left-1.5 top-0 bottom-0 z-50 flex w-3 cursor-col-resize select-none items-center justify-center"
          >
            <div className="h-full w-[3px] transition-colors group-hover:bg-primary/70 group-active:bg-primary" />
          </div>
        )}

        <CopilotPanelTabs
          tab={tab}
          onTabChange={setTab}
          onClose={onClose}
          teamPanel={teamPanel}
          copilotPanel={<CopilotAssistantView proyectoId={proyectoId} />}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      </aside>
    </>
  )
}
