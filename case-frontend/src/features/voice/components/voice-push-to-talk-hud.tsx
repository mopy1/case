import { Check, Mic } from "lucide-react"

interface VoicePushToTalkHudProps {
  isPushing: boolean
  isSending: boolean
  liveText: string
}

export function VoicePushToTalkHud({
  isPushing,
  isSending,
  liveText,
}: VoicePushToTalkHudProps) {
  if (!isPushing && !isSending) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-red-500/30 bg-card/95 px-4 sm:px-6 py-3.5 shadow-2xl backdrop-blur-md w-[92vw] sm:w-auto max-w-[480px]">
        <div className="flex items-center gap-3 w-full">
          <div className="relative flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            {isSending ? (
              <Check className="size-4.5 text-emerald-500 animate-scale-in" />
            ) : (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <Mic className="relative size-4.5" />
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-tight text-foreground">
                {isSending ? "Enviando al Copilot…" : "Escuchando…"}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Suelta para enviar
              </span>
            </div>
            <p className="text-xs text-foreground/90 font-medium truncate mt-0.5 min-h-[18px]">
              {liveText || (isSending ? "Procesando audio..." : "Habla tu instrucción...")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full border-t border-border/50 pt-2 text-[10px] text-muted-foreground/70">
          <span>Atajo Push-to-Talk activo</span>
          <span className="font-mono bg-background/80 px-1.5 py-0.5 rounded border border-border/60">
            Mantén [Espacio] o [V]
          </span>
        </div>
      </div>
    </div>
  )
}
