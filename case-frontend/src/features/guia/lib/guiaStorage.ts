import type { GuiaProgreso, MisionId } from "../types/guia.types"
import { MISION_IDS } from "./guiaMisiones.data"

export const PROGRESO_INICIAL: GuiaProgreso = { v: 1, estado: "pendiente", ofrecida: false, colapsada: false, logradas: [] }

const ESTADOS = ["pendiente", "omitida", "completada"]

export const claveGuia = (userId: number) => `sw_case_guia_v1_${userId}`

function validar(valor: unknown): GuiaProgreso {
  if (typeof valor !== "object" || valor === null) return PROGRESO_INICIAL
  const p = valor as Partial<GuiaProgreso>
  if (p.v !== 1 || !ESTADOS.includes(String(p.estado)) || !Array.isArray(p.logradas)) return PROGRESO_INICIAL
  return {
    v: 1,
    estado: p.estado as GuiaProgreso["estado"],
    ofrecida: p.ofrecida === true,
    colapsada: p.colapsada === true,
    logradas: p.logradas.filter((id): id is MisionId => MISION_IDS.includes(id as MisionId)),
  }
}

/** `persistente: false` si localStorage lanza (modo privado bloqueado): sin oferta automática. */
export function leerProgreso(userId: number): { progreso: GuiaProgreso; persistente: boolean } {
  try {
    const crudo = localStorage.getItem(claveGuia(userId))
    if (!crudo) return { progreso: PROGRESO_INICIAL, persistente: true }
    try {
      return { progreso: validar(JSON.parse(crudo)), persistente: true }
    } catch {
      return { progreso: PROGRESO_INICIAL, persistente: true }
    }
  } catch {
    return { progreso: PROGRESO_INICIAL, persistente: false }
  }
}

export function guardarProgreso(userId: number, progreso: GuiaProgreso): void {
  try {
    localStorage.setItem(claveGuia(userId), JSON.stringify(progreso))
  } catch {
    // Sin storage: el progreso vive solo en memoria durante esta sesión.
  }
}
