import { useRef, useState } from "react"
import { Bot, Mic, MicOff } from "lucide-react"
import { ChatComposer, ChatComposerButton } from "@/components/chat"
import { CHAT_MAX_CARACTERES } from "../types/chat.types"
import type { MentionItem } from "../types/mention.types"
import { useChatVoiceInput } from "../hooks/useChatVoiceInput"
import { useMentionTrigger } from "../hooks/useMentionTrigger"
import { ChatMentionPopover } from "./chat-mention-popover"
import { TeamQuickActions } from "./team-quick-actions"

const NAV_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Tab", "Escape", "Home", "End"])

interface TeamComposerProps {
  enviando: boolean
  errorEnvio: string | null
  onEnviar: (contenido: string) => Promise<boolean>
  candidatos: MentionItem[]
  /** F4: con proyecto se muestra la fila de acciones rápidas (oculta con el popover de menciones abierto). */
  proyectoId?: number
}

/** Composer del Equipo: menciones con teclado, botón Senior Dev y dictado acumulativo. */
export function TeamComposer({ enviando, errorEnvio, onEnviar, candidatos, proyectoId }: TeamComposerProps) {
  const [texto, setTexto] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mention = useMentionTrigger({ candidatos, texto, setTexto, textareaRef })
  const voice = useChatVoiceInput({ texto, setTexto })

  async function enviar() {
    const limpio = texto.trim()
    if (!limpio || enviando) return
    voice.stopVoice()
    if (await onEnviar(limpio)) {
      setTexto("")
      mention.cerrarPopover()
    }
  }

  /** Acción rápida (D2): reemplaza el texto si está vacío; si no, lo agrega en una línea nueva. Nunca envía. */
  function insertarTexto(t: string) {
    setTexto((prev) => (prev.trim() ? `${prev.trimEnd()}\n${t}` : t))
    mention.cerrarPopover()
    setTimeout(() => {
      const el = textareaRef.current
      el?.focus()
      el?.setSelectionRange(el.value.length, el.value.length)
    }, 0)
  }

  function mencionarSeniorDev() {
    setTexto((prev) => (prev.includes("@SeniorDev") ? prev : `${prev ? `${prev.trim()} ` : ""}@SeniorDev `))
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  return (
    <ChatComposer
      value={texto}
      onValueChange={(valor, caret) => {
        setTexto(valor)
        mention.verificarMencion(valor, caret)
      }}
      onSubmit={() => void enviar()}
      onKeyDownCapture={mention.manejarKeyDown}
      onKeyUp={(e) => {
        if (!NAV_KEYS.has(e.key)) mention.verificarMencion(texto, e.currentTarget.selectionStart ?? 0)
      }}
      textareaRef={textareaRef}
      busy={enviando}
      maxLength={CHAT_MAX_CARACTERES}
      ariaLabel="Mensaje para el equipo"
      placeholder="Escribile al equipo… (@ para mencionar)"
      error={errorEnvio}
      quickActions={
        proyectoId && !mention.activo ? <TeamQuickActions proyectoId={proyectoId} onInsertar={insertarTexto} disabled={enviando} /> : undefined
      }
      overlay={
        mention.activo && (
          <ChatMentionPopover
            candidatos={mention.filtrados}
            indiceSeleccionado={mention.indiceSeleccionado}
            onSeleccionar={mention.insertarMencion}
            onHoverItem={mention.setIndiceSeleccionado}
          />
        )
      }
      tools={
        <>
          <ChatComposerButton icon={Bot} label="Mencionar a Senior Dev" onClick={mencionarSeniorDev} guia="equipo-seniordev" />
          <ChatComposerButton
            icon={voice.isSupported ? Mic : MicOff}
            label={!voice.isSupported ? "Tu navegador no soporta dictado por voz" : voice.isListening ? "Detener dictado" : "Dictar mensaje"}
            onClick={voice.toggleVoice}
            disabled={!voice.isSupported || enviando}
            pressed={voice.isListening}
            recording={voice.isListening}
            showLabel={voice.isListening ? "Escuchando" : undefined}
          />
        </>
      }
    />
  )
}
