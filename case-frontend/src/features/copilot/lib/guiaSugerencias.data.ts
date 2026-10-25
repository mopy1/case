import type { CopilotSection } from "../types/copilot.types"

/** Preguntas sugeridas en el vacío de la Guía (se envían al tocarlas). */
export const GUIA_PREGUNTA_PRINCIPAL = "¿Qué hago ahora?"

export const GUIA_SUGERENCIAS: Record<CopilotSection, string[]> = {
  diagrama: ["¿Cómo creo una tabla con atributos?", "¿Cómo relaciono dos tablas?", "¿Cómo hago una relación muchos a muchos?"],
  tareas: ["¿Cómo creo una tarea?", "¿Cómo muevo una tarea a Hecho?", "¿Puedo asignar tareas a un compañero?"],
  notas: ["¿Qué es un ADR?", "¿Cómo guardo una decisión?", "¿Puedo guardar un ADR desde el chat?"],
  xmi: ["¿Cómo exporto a Enterprise Architect?", "¿Cómo importo un XMI?", "¿Qué diferencia hay entre Fusionar y Reemplazar?"],
  generador: ["¿Qué genera el backend en ZIP?", "¿Cómo veo el DDL de PostgreSQL?", "¿Cómo ejecuto el proyecto descargado?"],
  general: ["¿Cómo invito a un compañero?", "¿Cómo le pregunto a Senior Dev?", "¿Qué diferencia hay entre Asistente y Guía?"],
}
