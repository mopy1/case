import { useEffect, useRef, useState } from "react"
import { ArrowUp, CornerDownLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VoiceMicButton, useSpeechRecognition } from "@/features/voice"
import type { CopilotSection } from "../types/copilot.types"
import { parseVoiceCommand } from "../lib/copilotVoiceUtils"
import { processImageFile, type ProcessedImage } from "../lib/copilotImageUtils"
import { SECTION_PLACEHOLDERS } from "../lib/copilotPlaceholders"
import { CopilotImageAttach } from "./copilot-image-attach"

interface CopilotInputProps {
  section: CopilotSection
  loading: boolean
  onSend: (text: string, image?: ProcessedImage) => void
}

export function CopilotInput({ section, loading, onSend }: CopilotInputProps) {
  const [text, setText] = useState("")
  const [attachedImage, setAttachedImage] = useState<ProcessedImage | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
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
          if (isSend && (finalMsg || attachedImage) && !loading) {
            onSend(finalMsg, attachedImage || undefined)
            setText("")
            setAttachedImage(null)
          } else {
            setText(finalMsg)
          }
          return
        }
        setText((baseTextRef.current ? `${baseTextRef.current} ${spokenText}` : spokenText).trim())
      },
    })

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 44), 160)}px`
  }, [text])

  function handleSend() {
    if (isListening) stopListening()
    baseTextRef.current = ""
    const trimmed = text.trim()
    if ((!trimmed && !attachedImage) || loading) return
    onSend(trimmed, attachedImage || undefined)
    setText("")
    setAttachedImage(null)
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

  async function handleImageSelected(file: File) {
    setIsProcessingImage(true)
    try {
      setAttachedImage(await processImageFile(file))
    } catch (err) {
      console.error("Error al procesar imagen:", err)
    } finally {
      setIsProcessingImage(false)
    }
  }

  return (
    <div className="border-t border-border bg-card/95 p-2.5 sm:p-3 backdrop-blur-xs">
      <div className="flex flex-col rounded-xl border border-border/80 bg-background p-2 shadow-xs transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={attachedImage ? "Añade instrucciones o presiona Enviar para reconocer..." : (SECTION_PLACEHOLDERS[section] || "Escribe tu consulta o instrucción...")}
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
            <CopilotImageAttach
              attachedImage={attachedImage}
              isProcessing={isProcessingImage}
              disabled={loading}
              onImageSelected={handleImageSelected}
              onRemoveImage={() => setAttachedImage(null)}
            />
            <VoiceMicButton
              isListening={isListening}
              isSupported={isSupported}
              onClick={handleToggleVoice}
              disabled={loading}
            />
            <Button
              type="button"
              size="icon"
              disabled={(!text.trim() && !attachedImage) || loading || isProcessingImage}
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
