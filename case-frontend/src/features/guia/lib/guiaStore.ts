import type { GuiaProgreso, MisionId } from "../types/guia.types"
import { guardarProgreso, leerProgreso, PROGRESO_INICIAL } from "./guiaStorage"

export interface GuiaSnapshot {
  progreso: GuiaProgreso
  /** La primera detección de esta sesión ya terminó (antes: skeletons en la tarjeta). */
  detectado: boolean
  /** false = localStorage bloqueado. */
  persistente: boolean
}

export const SNAPSHOT_VACIO: GuiaSnapshot = { progreso: PROGRESO_INICIAL, detectado: false, persistente: false }

const snapshots = new Map<number, GuiaSnapshot>()
const oyentes = new Set<() => void>()

/** Store externo para `useSyncExternalStore`: todos los consumidores ven el mismo estado sin Context. */
export function suscribirGuia(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

export function obtenerGuia(userId: number): GuiaSnapshot {
  let snap = snapshots.get(userId)
  if (!snap) {
    const { progreso, persistente } = leerProgreso(userId)
    snap = { progreso, detectado: false, persistente }
    snapshots.set(userId, snap)
  }
  return snap
}

function reemplazar(userId: number, snap: GuiaSnapshot) {
  snapshots.set(userId, snap)
  oyentes.forEach((o) => o())
}

export function actualizarProgreso(userId: number, cambio: (p: GuiaProgreso) => GuiaProgreso): void {
  const snap = obtenerGuia(userId)
  const progreso = cambio(snap.progreso)
  if (progreso === snap.progreso) return
  guardarProgreso(userId, progreso)
  reemplazar(userId, { ...snap, progreso })
}

/** Las misiones son pegajosas: solo se suman, nunca se quitan. */
export function sumarLogradas(userId: number, ids: MisionId[]): void {
  actualizarProgreso(userId, (p) => {
    const nuevas = ids.filter((id) => !p.logradas.includes(id))
    return nuevas.length === 0 ? p : { ...p, logradas: [...p.logradas, ...nuevas] }
  })
}

export function marcarDetectado(userId: number): void {
  const snap = obtenerGuia(userId)
  if (!snap.detectado) reemplazar(userId, { ...snap, detectado: true })
}
