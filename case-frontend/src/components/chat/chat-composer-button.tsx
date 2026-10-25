import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface ChatComposerButtonProps {
  icon: LucideIcon
  /** Tooltip + aria-label. */
  label: string
  onClick: () => void
  pressed?: boolean
  recording?: boolean
  disabled?: boolean
  /** Muestra un texto junto al icono (p. ej. "Escuchando"). */
  showLabel?: string
}

/** Herramienta del composer (voz, adjuntar, mencionar a Senior Dev). */
export function ChatComposerButton({ icon: Icon, label, onClick, pressed, recording, disabled, showLabel }: ChatComposerButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size={showLabel ? "sm" : "icon-sm"}
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={pressed}
            className={cn("text-muted-foreground", recording && "bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive")}
          />
        }
      >
        <Icon data-icon={showLabel ? "inline-start" : undefined} />
        {showLabel && (
          <span className="text-xs" aria-live="polite">
            {showLabel}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
