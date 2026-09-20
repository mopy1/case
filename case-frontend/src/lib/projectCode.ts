/**
 * Codificador y decodificador bidireccional determinista para IDs de proyecto.
 * Transforma IDs numéricos incrementales (1, 2, 3...) en códigos alfanuméricos
 * limpios tipo Stripe/YouTube (ej: prj-r406p0) para proteger las URLs contra
 * enumeración de objetos e inspección visual.
 */

const MOD = 4294967296n // 2^32
const A = 1580030173n // Coprimo grande impar
const B = 59283719n // Desplazamiento de sal
const A_INV = 59260789n // Inverso multiplicativo modular (A * A_INV % MOD === 1)
const PREFIX = "prj-"

/**
 * Codifica un ID numérico de proyecto a un slug limpio tipo Stripe/YouTube.
 * Ej: 1 -> "prj-r406p0", 2 -> "prj-1h8pps1"
 */
export function encodeProjectId(id: number | string | undefined | null): string {
  if (id === undefined || id === null) return ""
  const num = typeof id === "string" ? parseInt(id, 10) : id
  if (isNaN(num) || num <= 0) return ""

  const enc = (BigInt(num) * A + B) % MOD
  return `${PREFIX}${enc.toString(36)}`
}

/**
 * Decodifica un slug o ID hacia el número entero del proyecto.
 * Soporta tanto "prj-r406p0" como números directos "1" para retrocompatibilidad total.
 */
export function decodeProjectId(slug: string | number | undefined | null): number {
  if (slug === undefined || slug === null) return 0
  if (typeof slug === "number") return isNaN(slug) ? 0 : slug

  const str = String(slug).trim()
  if (!str) return 0

  // Si ya es numérico directo (retrocompatibilidad)
  if (/^\d+$/.test(str)) {
    const parsed = parseInt(str, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  // Si tiene el prefijo de ofuscación
  if (str.startsWith(PREFIX)) {
    const b36 = str.slice(PREFIX.length)
    try {
      const enc = BigInt(parseInt(b36, 36))
      let diff = (enc - B) % MOD
      if (diff < 0n) diff += MOD
      const dec = (diff * A_INV) % MOD
      return Number(dec)
    } catch {
      return 0
    }
  }

  return 0
}
