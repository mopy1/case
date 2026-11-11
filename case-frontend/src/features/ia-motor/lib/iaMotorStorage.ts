import { CONFIG_POR_DEFECTO, type MotorIaConfig } from "../types/iaMotor.types"

/** El front es la fuente de verdad del motor: el backend solo lo guarda en memoria y se re-sincroniza con PUT. */
const CLAVE = "sw_case_ia_motor_v1"

function esConfig(valor: unknown): valor is MotorIaConfig {
  if (!valor || typeof valor !== "object") return false
  const v = valor as Record<string, unknown>
  const motorOk = v.motor === "DEEPSEEK" || v.motor === "QWEN_KAGGLE"
  const urlOk = v.urlKaggle === null || typeof v.urlKaggle === "string"
  return motorOk && urlOk && (v.motor === "DEEPSEEK" || Boolean(v.urlKaggle))
}

export function leerMotor(): MotorIaConfig {
  try {
    const crudo = localStorage.getItem(CLAVE)
    const valor: unknown = crudo ? JSON.parse(crudo) : null
    return esConfig(valor) ? valor : CONFIG_POR_DEFECTO
  } catch {
    return CONFIG_POR_DEFECTO
  }
}

export function guardarMotorLocal(config: MotorIaConfig): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(config))
  } catch {
    // localStorage bloqueado (modo privado): la preferencia vive solo en memoria hasta recargar.
  }
}

/** Chequeo liviano antes de mandar al backend (que valida de verdad y normaliza a `/v1`). */
export function urlKaggleValida(url: string): boolean {
  try {
    const u = new URL(url.trim())
    return u.protocol === "https:" && /(^|\.)ngrok(-free)?\.(app|dev|io)$/i.test(u.hostname)
  } catch {
    return false
  }
}

/** Misma normalización que el backend: sin barras finales y terminada en `/v1`. */
export function normalizarUrlKaggle(url: string): string {
  const base = url.trim().replace(/\/+$/, "")
  return base.endsWith("/v1") ? base : `${base}/v1`
}
