import type { IaMotorSnapshot } from "../types/iaMotor.types"
import { ETIQUETA_MOTOR } from "../types/iaMotor.types"

/** Frase corta del estado para el menú y el `aria-label` del selector. */
export function textoSalud({ config, salud, ultimaPrueba }: IaMotorSnapshot): string {
  if (config.motor === "DEEPSEEK") return "Disponible"
  if (salud === "sin-configurar") return "Sin endpoint configurado"
  if (salud === "probando") return "Probando conexión…"
  if (salud === "activo") return ultimaPrueba?.latenciaMs != null ? `Activo · ${ultimaPrueba.latenciaMs} ms` : "Activo"
  return "Kaggle no responde: se usa DeepSeek de respaldo"
}

export function etiquetaSelector(snapshot: IaMotorSnapshot): string {
  return `Motor de IA: ${ETIQUETA_MOTOR[snapshot.config.motor].larga}. ${textoSalud(snapshot)}`
}

/** Host del túnel para mostrarlo sin la URL entera. */
export function hostDe(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
