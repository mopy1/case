import type { usePanelResize } from "../hooks/usePanelResize"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PanelResizeHandleProps = Pick<
  ReturnType<typeof usePanelResize>,
  "width" | "min" | "max" | "isDragging" | "reset" | "handleProps"
>

/** Divisor accesible (role="separator") del panel lateral: arrastre, teclado y doble clic. */
export function PanelResizeHandle({ width, min, max, isDragging, reset, handleProps }: PanelResizeHandleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={600}
        render={
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Ancho del panel"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={width}
            tabIndex={0}
            data-dragging={isDragging || undefined}
            onDoubleClick={reset}
            {...handleProps}
            className="group/handle absolute inset-y-0 -left-1 z-10 flex w-2 cursor-col-resize touch-none items-center justify-center outline-none"
          />
        }
      >
        {isDragging && <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-primary/60" />}
        <span
          aria-hidden="true"
          className={cn(
            "h-8 w-1 rounded-full bg-border transition-[height,background-color] duration-150",
            "group-hover/handle:h-12 group-hover/handle:bg-primary group-focus-visible/handle:h-12 group-focus-visible/handle:bg-primary",
            isDragging && "h-12 bg-primary"
          )}
        />
      </TooltipTrigger>
      <TooltipContent side="left">Arrastrá para ajustar · doble clic para restablecer</TooltipContent>
    </Tooltip>
  )
}
