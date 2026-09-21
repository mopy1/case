export function parseVoiceCommand(text: string) {
  const trimmed = text.trim()
  const isSend = /\b(?:enviar|envía|mandar)\s*[.!]?$/i.test(trimmed)
  const isStop = /\b(?:detener|parar)\s*[.!]?$/i.test(trimmed)
  const clean = trimmed.replace(/\b(?:enviar|envía|mandar|detener|parar)\s*[.!]?$/i, "").trim()
  return { isSend, isStop, clean }
}
