import type { CopilotSection } from "../types/copilot.types"

export function detectActiveSection(pathname: string): CopilotSection {
  if (pathname.includes("/diagrama")) return "diagrama"
  if (pathname.includes("/tareas")) return "tareas"
  if (pathname.includes("/notas")) return "notas"
  if (pathname.includes("/xmi")) return "xmi"
  if (pathname.includes("/generador")) return "generador"
  return "general"
}

export const SECTION_LABELS: Record<CopilotSection, string> = {
  diagrama: "Diagrama",
  tareas: "Tareas",
  notas: "Notas",
  xmi: "XMI",
  generador: "Generador",
  general: "General",
}
