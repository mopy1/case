import type { GuiaPasoId } from "../types/guia.types"
import { esPasoId } from "./guiaPasos.data"

const LINEA_PASO = /^\s*\**GUIA_PASO:?\**\s*\[?([a-z-]+)\]?.*$/gim
const MAX_PASOS = 2

/** Ids de `GUIA_PASO: [id]` que existen en `guiaPasos.data.ts` (máx. 2, sin repetir). */
export function parseGuiaPasos(texto: string): GuiaPasoId[] {
  const ids = [...texto.matchAll(LINEA_PASO)].map((m) => m[1].toLowerCase()).filter(esPasoId)
  return [...new Set(ids)].slice(0, MAX_PASOS)
}

export function quitarLineasGuiaPaso(texto: string): string {
  return texto.replace(LINEA_PASO, "")
}
