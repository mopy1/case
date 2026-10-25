import { useMemo, useRef, useState } from "react"
import { ArrowUp, CornerDownLeft, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CHAT_MAX_CARACTERES } from "../types/chat.types"
import type { MentionItem } from "../types/mention.types"
import { useMentionTrigger } from "../hooks/useMentionTrigger"
import { useChatVoiceInput } from "../hooks/useChatVoiceInput"
import { ChatMentionPopover } from "./chat-mention-popover"
import { ChatVoiceButton } from "./chat-voice-button"

const SENIOR_DEV_ITEM: MentionItem = { id: "seniordev", username: "SeniorDev", nombreMostrar: "Senior Dev", esIa: true }

interface ChatInputProps {
  enviando: boolean
  errorEnvio: string | null
  onEnviar: (contenido: string) => Promise<boolean>
  candidatos?: MentionItem[]
}

/** Input del chat grupal con soporte para menciones @, entrada por voz y SeniorDev. */
export function ChatInput({ enviando, errorEnvio, onEnviar, candidatos }: ChatInputProps) {
  const [texto, setTexto] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const items = useMemo(() => candidatos ?? [SENIOR_DEV_ITEM], [candidatos])
  const mention = useMentionTrigger({ candidatos: items, texto, setTexto, textareaRef })
  const voice = useChatVoiceInput({ texto, setTexto })
  const limpio = texto.trim()

  async function handleEnviar() {
    if (!limpio || enviando) return
    voice.stopVoice()
    if (await onEnviar(limpio)) {
      setTexto("")
      mention.cerrarPopover()
    }
  }

  function insertarSeniorDev() {
    setTexto((prev) => (prev.includes("@SeniorDev") ? prev : `${prev ? `${prev.trim()} ` : ""}@SeniorDev `))
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <div className="relative border-t border-border bg-card/95 p-2.5 backdrop-blur-xs sm:p-3">
      {mention.activo && (
        <ChatMentionPopover
          candidatos={mention.filtrados}
          indiceSeleccionado={mention.indiceSeleccionado}
          onSeleccionar={mention.insertarMencion}
          onHoverItem={mention.setIndiceSeleccionado}
        />
      )}
      <div className="flex flex-col rounded-xl border border-border/80 bg-background p-2 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
        <div className="flex items-center gap-1.5 px-1 pb-1">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={insertarSeniorDev}
            className="h-6 gap-1 border-primary/30 bg-primary/5 text-[11px] font-medium text-primary hover:bg-primary/10"
          >
            <Sparkles className="size-3 text-primary" /> + @SeniorDev
          </Button>
          <ChatVoiceButton
            isListening={voice.isListening}
            isSupported={voice.isSupported}
            onToggle={voice.toggleVoice}
            disabled={enviando}
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            mention.verificarMencion(e.target.value, e.target.selectionStart ?? 0)
          }}
          onKeyUp={(e) => mention.verificarMencion(texto, e.currentTarget.selectionStart ?? 0)}
          onKeyDown={(e) => {
            if (mention.manejarKeyDown(e)) return
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              void handleEnviar()
            }
          }}
          maxLength={CHAT_MAX_CARACTERES}
          disabled={enviando}
          rows={1}
          aria-label="Mensaje para el equipo"
          placeholder="Escribile al equipo, usá @ para mencionar o dictá con voz…"
          className="max-h-40 min-h-11 rounded-none border-0 bg-transparent px-2 py-1 text-base shadow-none focus-visible:ring-0 sm:text-xs dark:bg-transparent"
        />
        <div className="flex items-center gap-2 px-1 pt-1 text-[10px] text-muted-foreground/70">
          <span className="hidden items-center gap-1 select-none sm:inline-flex">
            <CornerDownLeft className="size-2.5" /> Enviar • ⇧↵ Salto de línea
          </span>
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
