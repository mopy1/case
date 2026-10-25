import type { ChatMessageVariant } from "../chat.types"

const FORMATO_HORA = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false })
const FORMATO_DIA = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" })

/** "14:05" (24 h) en los dos chats. */
export function horaCorta(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? "" : FORMATO_HORA.format(fecha)
}

const claveDia = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** "Hoy" | "Ayer" | "24 oct" para el separador de día. */
export function etiquetaDia(iso: string, hoy: Date = new Date()): string {
  const fecha = new Date(iso)
  if (claveDia(fecha) === claveDia(hoy)) return "Hoy"
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  if (claveDia(fecha) === claveDia(ayer)) return "Ayer"
  return FORMATO_DIA.format(fecha).replace(".", "")
}

/** true si dos mensajes caen en días distintos (para insertar el separador). */
export function cambiaDeDia(prevIso: string | undefined, curIso: string): boolean {
  return !prevIso || claveDia(new Date(prevIso)) !== claveDia(new Date(curIso))
}

interface ItemAgrupable {
  autorKey: string
  iso: string
  variant: ChatMessageVariant
}

/** Mismo autor, misma variante (no sistema), mismo día y menos de `ventanaMin` minutos de diferencia. */
export function debeAgrupar(prev: ItemAgrupable | undefined, cur: ItemAgrupable, ventanaMin = 5): boolean {
  if (!prev || cur.variant === "system" || prev.variant !== cur.variant || prev.autorKey !== cur.autorKey) return false
  if (cambiaDeDia(prev.iso, cur.iso)) return false
  const diferencia = new Date(cur.iso).getTime() - new Date(prev.iso).getTime()
  return diferencia >= 0 && diferencia < ventanaMin * 60_000
}
