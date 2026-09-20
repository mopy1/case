export interface SpeechRecognitionAlternativeItem {
  transcript: string
  confidence: number
}

export interface SpeechRecognitionResultItem {
  isFinal: boolean
  length: number
  [index: number]: SpeechRecognitionAlternativeItem
}

export interface SpeechRecognitionResultListItems {
  length: number
  [index: number]: SpeechRecognitionResultItem
}

export interface SpeechRecognitionCustomEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultListItems
}

export interface SpeechRecognitionErrorCustomEvent extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorCustomEvent) => void) | null
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionCustomEvent) => void) | null
  start(): void
  stop(): void
  abort(): void
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

export interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onEnd?: () => void
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
  startListening: (options?: { lang?: string }) => void
  stopListening: () => void
  resetTranscript: () => void
}
