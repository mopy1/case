import { Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ChatVoiceButtonProps {
  isListening: boolean
  isSupported: boolean
  onToggle: () => void
  disabled?: boolean
}

/**
 * Botón de micrófono para transcripción de voz en el chat con estado pulsante y feedback.
 */
export function ChatVoiceButton({
  isListening,
  isSupported,
  onToggle,
  disabled = false,
}: ChatVoiceButtonProps) {
  if (!isSupported) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled
              className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground/60 opacity-60"
              aria-label="Voz no soportada por el navegador"
            >
              <MicOff className="size-3" />
            </Button>
          }
        />
        <TooltipContent side="top">
          Tu navegador no soporta reconocimiento de voz nativo
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "outline"}
      size="xs"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "h-6 gap-1.5 text-[11px] font-medium transition-all select-none",
        isListening
          ? "border-destructive/40 bg-destructive text-destructive-foreground shadow-xs animate-pulse hover:bg-destructive/90"
          : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      )}
      aria-label={isListening ? "Detener dictado por voz" : "Dictar mensaje por voz"}
    >
      {isListening ? (
        <>
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-white" />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Escuchando…</span>
        </>
      ) : (
        <>
          <Mic className="size-3 text-muted-foreground" />
          <span className="hidden sm:inline text-[10px]">Dictar</span>
        </>
      )}
    </Button>
  )
}
