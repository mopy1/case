import type { CopilotSection } from "../types/copilot.types"

export const SECTION_PLACEHOLDERS: Record<CopilotSection, string> = {
  diagrama: "Escribe tablas, relaciones o toma foto a un diagrama...",
  generador: "Pregunta sobre Spring Boot 3.4, dependencias, controladores...",
  xmi: "Pregunta sobre importar o exportar XMI para EA 16...",
  notas: "Pide documentar decisiones arquitectónicas o registrar ADRs...",
  tareas: "Pregunta sobre tareas y colaboradores del proyecto...",
  general: "Escribe tu consulta, pide crear tablas o sube un diagrama...",
}
