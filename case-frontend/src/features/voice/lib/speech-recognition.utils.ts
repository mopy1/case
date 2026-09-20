import type {
  SpeechRecognitionConstructor,
  SpeechRecognitionCustomEvent,
} from "../types/speech-recognition.types"

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Permiso de micrófono denegado. Permite el acceso en el navegador.",
  "no-speech": "No se detectó voz. Intenta hablar nuevamente.",
  "audio-capture": "No se encontró ningún micrófono disponible.",
  network: "Error de red al procesar el reconocimiento de voz.",
  "language-not-supported": "El idioma configurado no está disponible en este navegador.",
  "service-not-allowed": "Servicio de reconocimiento de voz no permitido.",
}

export function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return win.SpeechRecognition || win.webkitSpeechRecognition
}

export function parseSpeechRecognitionResults(event: SpeechRecognitionCustomEvent) {
  let final = ""
  let interim = ""
  for (let i = 0; i < event.results.length; i++) {
    const item = event.results[i]
    const text = item[0]?.transcript || ""
    if (item.isFinal) {
      final += text
    } else {
      interim += text
    }
  }
  const fullText = (final + (interim ? (final ? " " : "") + interim : "")).trim()
  return { fullText, isFinal: interim.length === 0 }
}

export function getFriendlyErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || `Error de reconocimiento: ${errorCode}`
}
