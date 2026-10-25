import { Database, FileCode, Gauge, ListChecks, ScrollText } from "lucide-react"
import type { QuickAction } from "@/components/chat"

export type ChatQuickActionId = "auditar" | "indices" | "normalizacion" | "decisiones" | "ddl"

/** Acción rápida del Equipo: `prompt` se inserta en el input (D2); `null` = acción local (abrir el visor DDL). */
export interface ChatQuickActionDef extends QuickAction {
  id: ChatQuickActionId
  prompt: string | null
}

const SIN_SQL = "Sin SQL; propone los cambios como comandos, tareas o ADR."

export const CHAT_QUICK_ACTIONS: ChatQuickActionDef[] = [
  {
    id: "auditar",
    label: "Auditar modelo",
    icon: ListChecks,
    tooltip: "Revisión general del diagrama",
    prompt: `@SeniorDev Auditá el modelo actual: claves, tipos, relaciones y nombres inconsistentes. ${SIN_SQL}`,
  },
  {
    id: "indices",
    label: "Sugerir índices",
    icon: Gauge,
    tooltip: "Índices según las búsquedas probables",
    prompt: `@SeniorDev ¿Qué índices convendría agregar según las consultas más probables del sistema? ${SIN_SQL}`,
  },
  {
    id: "normalizacion",
    label: "Revisar normalización",
    icon: Database,
    tooltip: "Formas normales y redundancias",
    prompt: `@SeniorDev Revisá la normalización del modelo (1FN a 3FN) y señalá redundancias. ${SIN_SQL}`,
  },
  {
    id: "decisiones",
    label: "Resumir decisiones",
    icon: ScrollText,
    tooltip: "Lo que el equipo ya decidió",
    prompt: "@SeniorDev Resumí las decisiones que tomó el equipo hasta ahora, con quién y en qué mensaje.",
  },
  { id: "ddl", label: "Ver DDL", icon: FileCode, tooltip: "SQL generado desde el diagrama (no se envía al chat)", prompt: null },
]
