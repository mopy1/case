import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface VoiceMicButtonProps {
  isListening: boolean
  isSupported?: boolean
  onClick: () => void
  disabled?: boolean
  className?: string
  showLabel?: boolean
}

export function VoiceMicButton({
  isListening,
  isSupported = true,
  onClick,
  disabled = false,
  className,
  showLabel = true,
}: VoiceMicButtonProps) {
  const tooltipText = !isSupported
    ? "Reconocimiento de voz no soportado por este navegador"
    : isListening
      ? "Detener dictado por voz (o di 'enviar')"
      : "Dictar por voz (o mantén [Espacio] o [V] para Push-to-Talk rápido)"

  return (
    <div className="inline-flex items-center gap-1.5">
      {isListening && showLabel && (
        <span className="flex items-center gap-1 text-[10px] font-medium text-red-500 animate-pulse select-none">
          <span className="size-1.5 rounded-full bg-red-500 inline-block animate-ping" />
          Escuchando...
        </span>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || !isSupported}
              onClick={onClick}
              aria-label={tooltipText}
              className={cn(
                "size-7 rounded-lg transition-all cursor-pointer border",
                isListening
                  ? "animate-pulse bg-red-500/20 text-red-500 border-red-500/50 hover:bg-red-500/30 hover:text-red-500 shadow-xs"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60",
                className
              )}
            />
          }
        >
          {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}
