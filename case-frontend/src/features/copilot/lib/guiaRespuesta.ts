import { parseGuiaPasos, quitarLineasGuiaPaso, type GuiaPasoId } from "@/features/guia"
import type { CopilotSection } from "../types/copilot.types"
import { cleanResponseText, parseSystemActionSuggestions } from "./copilotParsers"

export interface GuiaRespuesta {
  texto: string
  pasos: GuiaPasoId[]
  irA?: CopilotSection
}

/**
 * La Guía nunca modifica el proyecto: de su texto solo se usan `IR_A` y `GUIA_PASO`.
 * Cualquier otro comando (CREAR_TABLA, ADR_SUGERIDA…) se descarta al limpiar el texto.
 */
export function parsearRespuestaGuia(crudo: string): GuiaRespuesta {
  const irA = parseSystemActionSuggestions(crudo).find((a) => a.tipo === "NAVEGAR")?.destino
  const texto = cleanResponseText(quitarLineasGuiaPaso(crudo))
  return { texto: texto || "Te muestro dónde está.", pasos: parseGuiaPasos(crudo), irA }
}
