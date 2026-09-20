import type { CopilotMessage, CopilotSection } from "../types/copilot.types"

export function detectActiveSection(pathname: string): CopilotSection {
  if (pathname.includes("/diagrama")) return "diagrama"
  if (pathname.includes("/tareas")) return "tareas"
  if (pathname.includes("/notas")) return "notas"
  if (pathname.includes("/xmi")) return "xmi"
  if (pathname.includes("/generador")) return "generador"
  return "general"
}

export function createWelcomeMessage(section: CopilotSection): CopilotMessage {
  return {
    id: "welcome",
    sender: "assistant",
    text: "¡Hola! Soy tu copiloto y manual contextual de CASE Tool. Puedo modelar tablas y relaciones directamente en tu lienzo con guía anti-colisión, además de generar Spring Boot 3.4 y ADRs.",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    section,
  }
}
