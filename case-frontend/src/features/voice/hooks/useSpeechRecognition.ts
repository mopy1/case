import { useCallback, useEffect, useRef, useState } from "react"
import type {
  SpeechRecognitionInstance,
  UseSpeechRecognitionOptions,
  UseSpeechRecognitionReturn,
} from "../types/speech-recognition.types"
import {
  getFriendlyErrorMessage,
  getSpeechRecognition,
  parseSpeechRecognitionResults,
} from "../lib/speech-recognition.utils"

export function useSpeechRecognition({
  lang = "es-ES",
  continuous = true,
  interimResults = true,
  onResult,
  onError,
  onEnd,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const isSupported = Boolean(getSpeechRecognition())

  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const onEndRef = useRef(onEnd)
  const langRef = useRef(lang)

  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
    onEndRef.current = onEnd
    langRef.current = lang
  }, [onResult, onError, onEnd, lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignorar si ya estaba detenido
      }
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  const startListening = useCallback(
    (options?: { lang?: string }) => {
      const RecognitionClass = getSpeechRecognition()
      if (!RecognitionClass) {
        const msg = "Tu navegador no soporta reconocimiento de voz nativo (Web Speech API)."
        setError(msg)
        onErrorRef.current?.(msg)
        return
      }

      setError(null)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignorar si falló el abort previo
        }
      }

      try {
        const recognition = new RecognitionClass()
        recognition.lang = options?.lang || langRef.current || "es-ES"
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognition.onresult = (event) => {
          const { fullText, isFinal } = parseSpeechRecognitionResults(event)
          setTranscript(fullText)
          onResultRef.current?.(fullText, isFinal)
        }

        recognition.onerror = (event) => {
          if (event.error === "aborted") return
          const friendlyMessage = getFriendlyErrorMessage(event.error)
          setError(friendlyMessage)
          onErrorRef.current?.(friendlyMessage)
        }

        recognition.onend = () => {
          setIsListening(false)
          onEndRef.current?.()
        }

        recognitionRef.current = recognition
        recognition.start()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al iniciar el micrófono"
        setError(msg)
        setIsListening(false)
        onErrorRef.current?.(msg)
      }
    },
    [continuous, interimResults]
  )

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Cleanup
        }
      }
    }
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}
