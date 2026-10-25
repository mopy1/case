import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { QuickAction } from "./chat.types"

export interface ChatQuickActionsProps {
  actions: QuickAction[]
  onSelect: (action: QuickAction) => void
  ariaLabel: string
  disabled?: boolean
  /** row = fila con scroll horizontal (encima del composer); stack = columna (empty state). */
  layout?: "row" | "stack"
}

/** Acciones rápidas (F3/F4) o sugerencias del Copilot: botones outline, nunca primarios. */
export function ChatQuickActions({ actions, onSelect, ariaLabel, disabled, layout = "row" }: ChatQuickActionsProps) {
  if (actions.length === 0) return null
  const row = layout === "row"

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(row ? "no-scrollbar scroll-fade-x flex gap-1.5 overflow-x-auto" : "flex w-full max-w-xs flex-col gap-1.5")}
    >
      {actions.map((action) => {
        const Icon = action.icon
        const boton = (
          <Button
            key={action.id}
            type="button"
            variant="outline"
            size={row ? "xs" : "sm"}
            disabled={disabled || action.disabled}
            onClick={() => onSelect(action)}
            className={cn(!row && "h-auto min-h-8 justify-start rounded-xl py-1.5 text-left whitespace-normal")}
          >
            {Icon && <Icon data-icon="inline-start" />}
            {action.label}
          </Button>
        )
        if (!action.tooltip) return boton
        return (
          <Tooltip key={action.id}>
            <TooltipTrigger render={boton} />
            <TooltipContent side="top">{action.tooltip}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
