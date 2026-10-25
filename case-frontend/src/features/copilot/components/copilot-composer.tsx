import { useRef, useState } from "react"
import { Mic, MicOff } from "lucide-react"
import { ChatComposer, ChatComposerButton } from "@/components/chat"
import { useSpeechRecognition } from "@/features/voice"
import type { CopilotSection } from "../types/copilot.types"
import { processImageFile, type ProcessedImage } from "../lib/copilotImageUtils"
import { SECTION_PLACEHOLDERS } from "../lib/copilotPlaceholders"
import { parseVoiceCommand } from "../lib/copilotVoiceUtils"
import { CopilotImageButton, CopilotImagePreview } from "./copilot-image-attach"

interface CopilotComposerProps {
  section: CopilotSection
  loading: boolean
  onSend: (text: string, image?: ProcessedImage) => void
  /** Modo Guía: sin foto y con su propio placeholder. */
  sinImagen?: boolean
  placeholder?: string
  ariaLabel?: string
}

/** Composer del Copilot (Asistente y Guía): texto, dictado con comandos "enviar"/"detener" y foto del diagrama. */
export function CopilotComposer({ section, loading, onSend, sinImagen, placeholder, ariaLabel }: CopilotComposerProps) {
  const [text, setText] = useState("")
  const [image, setImage] = useState<ProcessedImage | null>(null)
  const [processing, setProcessing] = useState(false)
  const baseTextRef = useRef("")

  function enviar(mensaje: string) {
    if ((!mensaje && !image) || loading) return
    onSend(mensaje, image ?? undefined)
    setText("")
    setImage(null)
  }

  const voz = useSpeechRecognition({
    lang: "es-ES",
    onResult: (spoken) => {
      const { isSend, isStop, clean } = parseVoiceCommand(spoken)
      const base = baseTextRef.current
      if (isSend || isStop) {
        const final = (base ? `${base} ${clean}` : clean).trim()
        voz.stopListening()
        voz.resetTranscript()
        baseTextRef.current = ""
        if (isSend) enviar(final)
        else setText(final)
        return
      }
      setText((base ? `${base} ${spoken}` : spoken).trim())
    },
  })

  function toggleVoz() {
    if (voz.isListening) {
      voz.stopListening()
      baseTextRef.current = ""
      return
    }
    baseTextRef.current = text.trim()
    voz.resetTranscript()
    voz.startListening()
  }

  async function adjuntar(file: File) {
    setProcessing(true)
    try {
      setImage(await processImageFile(file))
    } catch (err) {
      console.error("Error al procesar imagen:", err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <ChatComposer
      value={text}
      onValueChange={(valor) => setText(valor)}
      onSubmit={() => {
        if (voz.isListening) voz.stopListening()
        baseTextRef.current = ""
        enviar(text.trim())
      }}
      busy={loading}
      canSubmit={(text.trim() !== "" || image !== null) && !processing}
      ariaLabel={ariaLabel ?? "Mensaje para el Copilot"}
      placeholder={image ? "Agregá instrucciones o enviá la foto" : (placeholder ?? SECTION_PLACEHOLDERS[section])}
      attachment={(image || processing) && <CopilotImagePreview image={image} processing={processing} onRemove={() => setImage(null)} />}
      tools={
        <>
          {!sinImagen && <CopilotImageButton disabled={loading || processing} onImageSelected={(f) => void adjuntar(f)} />}
          <ChatComposerButton
            icon={voz.isSupported ? Mic : MicOff}
            label={!voz.isSupported ? "Tu navegador no soporta dictado por voz" : voz.isListening ? "Detener dictado" : "Dictar (decí \"enviar\" para mandar)"}
            onClick={toggleVoz}
            disabled={!voz.isSupported || loading}
            pressed={voz.isListening}
            recording={voz.isListening}
            showLabel={voz.isListening ? "Escuchando" : undefined}
          />
        </>
      }
    />
  )
}
