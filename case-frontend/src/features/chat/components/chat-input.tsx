import { useRef, useState } from "react"
import { ArrowUp, CornerDownLeft, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CHAT_MAX_CARACTERES } from "../types/chat.types"

const AVISO_LARGO = 3500

interface ChatInputProps {
  enviando: boolean
  errorEnvio: string | null
  onEnviar: (contenido: string) => Promise<boolean>
}

/** Input del chat con soporte para atajo rápido de mención a Senior Dev. */
export function ChatInput({ enviando, errorEnvio, onEnviar }: ChatInputProps) {
  const [texto, setTexto] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const limpio = texto.trim()

  async function handleEnviar() {
    if (!limpio || enviando) return
    if (await onEnviar(limpio)) setTexto("")
  }

  function insertarMencionIa() {
    setTexto((prev) => {
      if (prev.includes("@SeniorDev")) return prev
      const prefijo = prev.length > 0 && !prev.endsWith(" ") ? `${prev} ` : prev
      return `${prefijo}@SeniorDev `
    })
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <div className="border-t border-border bg-card/95 p-2.5 backdrop-blur-xs sm:p-3">
      <div className="flex flex-col rounded-xl border border-border/80 bg-background p-2 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
        <div className="flex items-center gap-1.5 px-1 pb-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={insertarMencionIa}
            className="h-6 gap-1 border-primary/30 bg-primary/5 text-[11px] font-medium text-primary hover:bg-primary/10"
          >
            <Sparkles className="size-3 text-primary" /> + @SeniorDev
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void handleEnviar()
            }
          }}
          maxLength={CHAT_MAX_CARACTERES}
          disabled={enviando}
          rows={1}
          aria-label="Mensaje para el equipo"
          placeholder="Escribile al equipo o invocá a @SeniorDev…"
          className="max-h-40 min-h-11 rounded-none border-0 bg-transparent px-2 py-1 text-base shadow-none focus-visible:ring-0 sm:text-xs dark:bg-transparent"
        />

        <div className="flex items-center gap-2 px-1 pt-1 text-[10px] text-muted-foreground/70">
          <span className="hidden items-center gap-1 select-none sm:inline-flex">
            <CornerDownLeft className="size-2.5" /> Enviar • ⇧↵ Salto de línea
          </span>
          {texto.length >= AVISO_LARGO && (
            <span className="tabular-nums">
              {texto.length}/{CHAT_MAX_CARACTERES}
            </span>
          )}
          <Button
            type="button"
            size="icon-sm"
            disabled={!limpio || enviando}
            onClick={() => void handleEnviar()}
            aria-label="Enviar mensaje al equipo"
            className="ml-auto size-8 rounded-lg sm:size-7"
          >
            {enviando ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
          </Button>
        </div>
      </div>
      {errorEnvio && <p className="px-1 pt-1.5 text-xs text-destructive">{errorEnvio}</p>}
    </div>
  )
}
