import { useEffect, useRef, useState } from "react"
import { ArrowUp, CornerDownLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceMicButton, useSpeechRecognition } from "@/features/voice"
import type { CopilotSection } from "../types/copilot.types"

interface CopilotInputProps {
  section: CopilotSection
  loading: boolean
  onSend: (text: string) => void
}

const SECTION_PLACEHOLDERS: Record<CopilotSection, string> = {
  diagrama: "Escribe tablas, relaciones o notas (ej: Cliente 1 a N Mascotas)...",
  generador: "Pregunta sobre Spring Boot 3.4, dependencias, controladores...",
  xmi: "Pregunta sobre importar o exportar XMI para EA 16...",
  notas: "Pide documentar decisiones arquitectónicas o registrar ADRs...",
  tareas: "Pregunta sobre tareas y colaboradores del proyecto...",
  general: "Escribe tu consulta o pide crear tablas y notas...",
}

function parseVoiceCommand(text: string) {
  const trimmed = text.trim()
  const isSend = /\b(?:enviar|envía|mandar)\s*[.!]?$/i.test(trimmed)
  const isStop = /\b(?:detener|parar)\s*[.!]?$/i.test(trimmed)
  const clean = trimmed.replace(/\b(?:enviar|envía|mandar|detener|parar)\s*[.!]?$/i, "").trim()
  return { isSend, isStop, clean }
}

export function CopilotInput({ section, loading, onSend }: CopilotInputProps) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const baseTextRef = useRef("")

  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      lang: "es-ES",
      onResult: (spokenText) => {
        const { isSend, isStop, clean } = parseVoiceCommand(spokenText)
        const finalMsg = (baseTextRef.current ? `${baseTextRef.current} ${clean}` : clean).trim()

        if (isSend || isStop) {
          stopListening()
          resetTranscript()
          baseTextRef.current = ""
          if (isSend && finalMsg && !loading) {
            onSend(finalMsg)
            setText("")
            if (textareaRef.current) textareaRef.current.style.height = "auto"
          } else {
            setText(finalMsg)
          }
          return
        }

        const combined = (baseTextRef.current ? `${baseTextRef.current} ${spokenText}` : spokenText).trim()
        setText(combined)
      },
    })

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 160)
    textarea.style.height = `${newHeight}px`
  }, [text])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSend() {
    if (isListening) stopListening()
    baseTextRef.current = ""
    const trimmed = text.trim()
    if (!trimmed || loading) return
    onSend(trimmed)
    setText("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function handleToggleVoice() {
    if (isListening) {
      stopListening()
      baseTextRef.current = ""
    } else {
      baseTextRef.current = text.trim()
      resetTranscript()
      startListening()
    }
  }

  return (
    <div className="border-t border-border bg-card/95 p-2.5 sm:p-3 backdrop-blur-xs">
      <div className="flex flex-col rounded-xl border border-border/80 bg-background p-2 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setTimeout(() => {
              textareaRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
            }, 150)
          }}
          placeholder={SECTION_PLACEHOLDERS[section] || "Escribe tu consulta o instrucción..."}
          disabled={loading}
          rows={1}
          className="w-full resize-none bg-transparent px-2 py-1 text-base sm:text-xs leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 overflow-y-auto break-words"
          style={{ minHeight: "44px", maxHeight: "160px" }}
        />
        <div className="flex items-center justify-between gap-1 pt-1 px-1 text-[10px] text-muted-foreground/60">
          <span className="hidden sm:inline-flex items-center gap-1 select-none">
            <CornerDownLeft className="size-2.5" /> ↵ Enviar • ⇧↵ Salto de línea
          </span>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <VoiceMicButton
              isListening={isListening}
              isSupported={isSupported}
              onClick={handleToggleVoice}
              disabled={loading}
            />
            <Button
              type="button"
              size="icon"
              disabled={!text.trim() || loading}
              onClick={handleSend}
              className="size-8 sm:size-7 rounded-lg cursor-pointer shrink-0"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ArrowUp className="size-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
