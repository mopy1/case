import { useCallback, useRef } from "react"
import { useSpeechRecognition } from "@/features/voice/hooks/useSpeechRecognition"

interface UseChatVoiceInputOptions {
  texto: string
  setTexto: (nuevo: string | ((prev: string) => string)) => void
}

/**
 * Wrapper sobre useSpeechRecognition con buffer persistente para no borrar el texto previo en el chat.
 */
export function useChatVoiceInput({ texto, setTexto }: UseChatVoiceInputOptions) {
  const baseTextRef = useRef("")

  const handleResult = useCallback(
    (transcript: string, isFinal: boolean) => {
      const base = baseTextRef.current.trim()
      const espacio = base.length > 0 ? " " : ""
      const nuevoTexto = base.length > 0 ? `${base}${espacio}${transcript}` : transcript

      setTexto(nuevoTexto)
      if (isFinal) {
        baseTextRef.current = nuevoTexto
      }
    },
    [setTexto]
  )

  const { isListening, isSupported, error, startListening, stopListening } =
    useSpeechRecognition({
      continuous: true,
      interimResults: true,
      onResult: handleResult,
    })

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      baseTextRef.current = texto
      startListening()
    }
  }, [isListening, startListening, stopListening, texto])

  const stopVoice = useCallback(() => {
    if (isListening) {
      stopListening()
    }
  }, [isListening, stopListening])

  return {
    isListening,
    isSupported,
    error,
    toggleVoice,
    stopVoice,
  }
}
