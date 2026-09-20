import { useCallback, useEffect, useRef, useState } from "react"
import { useSpeechRecognition } from "./useSpeechRecognition"

interface UsePushToTalkOptions {
  onSend: (text: string) => void
  enabled?: boolean
}

function isEligibleKey(e: KeyboardEvent): boolean {
  const isInput =
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    (e.target as HTMLElement)?.isContentEditable

  if (isInput) {
    return (e.ctrlKey && e.code === "Space") || (e.altKey && e.code === "KeyV")
  }

  if (e.code === "Space" && !e.ctrlKey && !e.metaKey && !e.altKey) return true
  if (e.code === "KeyV" && !e.ctrlKey && !e.metaKey && !e.altKey) return true
  if (e.ctrlKey && e.code === "Space") return true
  return false
}

export function usePushToTalk({ onSend, enabled = true }: UsePushToTalkOptions) {
  const [isPushing, setIsPushing] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [liveText, setLiveText] = useState("")

  const activeKeyRef = useRef<string | null>(null)
  const transcriptRef = useRef("")
  const isPendingSendRef = useRef(false)
  const onSendRef = useRef(onSend)
  onSendRef.current = onSend

  const dispatchSpeech = useCallback(() => {
    if (!isPendingSendRef.current) return
    isPendingSendRef.current = false
    setIsPushing(false)
    const raw = transcriptRef.current.trim()
    const clean = raw.replace(/\b(?:enviar|envía|mandar|detener|parar)\s*[.!]?$/i, "").trim()

    if (clean) {
      setIsSending(true)
      onSendRef.current(clean)
      setTimeout(() => {
        setIsSending(false)
        setLiveText("")
        transcriptRef.current = ""
      }, 700)
    } else {
      setIsSending(false)
      setLiveText("")
      transcriptRef.current = ""
    }
  }, [])

  const { isSupported, startListening, stopListening } = useSpeechRecognition({
    lang: "es-ES",
    continuous: true,
    interimResults: true,
    onResult: (text) => {
      transcriptRef.current = text
      setLiveText(text)
    },
    onEnd: () => {
      dispatchSpeech()
    },
  })

  const startTalk = useCallback(() => {
    transcriptRef.current = ""
    setLiveText("")
    setIsPushing(true)
    setIsSending(false)
    isPendingSendRef.current = false
    startListening()
  }, [startListening])

  const stopTalkAndSend = useCallback(() => {
    if (!isPushing) return
    isPendingSendRef.current = true
    stopListening()
    setTimeout(() => {
      if (isPendingSendRef.current) dispatchSpeech()
    }, 450)
  }, [isPushing, stopListening, dispatchSpeech])

  useEffect(() => {
    if (!enabled || !isSupported) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || activeKeyRef.current !== null) return
      if (isEligibleKey(e)) {
        if (e.code === "Space") e.preventDefault()
        activeKeyRef.current = e.code
        startTalk()
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (activeKeyRef.current && (e.code === activeKeyRef.current || e.code === "Space" || e.code === "KeyV")) {
        activeKeyRef.current = null
        stopTalkAndSend()
      }
    }

    const onBlur = () => {
      if (activeKeyRef.current) {
        activeKeyRef.current = null
        stopTalkAndSend()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [enabled, isSupported, startTalk, stopTalkAndSend])

  return {
    isPushing,
    isSending,
    liveText,
    isSupported,
    startTalk,
    stopTalkAndSend,
  }
}
