import type { CopilotSection } from "../types/copilot.types"

export function getQuickQuestionsForSection(section: CopilotSection): string[] {
  switch (section) {
    case "diagrama":
      return [
        "¿Cómo crear una relación N:M?",
        "Diseñar modelo de Usuarios y Roles con relación",
        "¿Cómo se calculan las posiciones para evitar colisiones?",
        "¿Cómo arrastrar puntos de control?",
      ]
    case "generador":
      return [
        "¿Qué dependencias incluye el pom.xml?",
        "¿Cómo ejecuto el backend descargado?",
        "¿Qué capas de código genera?",
      ]
    case "xmi":
      return [
        "¿Cómo importar este XMI en Enterprise Architect?",
        "¿Cómo exportar el diagrama para Enterprise Architect 16?",
      ]
    case "notas":
      return [
        "¿Qué es un ADR y por qué es inmutable?",
        "¿Cómo justificar decisiones de arquitectura ante el docente?",
        "Sugerir decisiones de arquitectura",
      ]
    case "tareas":
      return [
        "¿Cómo organizar el backlog del backend?",
        "¿Cómo vincular tareas a los colaboradores del proyecto?",
      ]
    default:
      return [
        "¿Cómo crear una relación N:M?",
        "¿Qué tipos de datos soporta?",
        "Sugerir decisiones de arquitectura",
      ]
  }
}
