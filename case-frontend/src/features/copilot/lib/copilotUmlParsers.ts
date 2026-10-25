import type { LadoMultiplicidad, TipoRelacionUml } from "@/features/diagram/types/diagram.types"

/** Traduce el texto libre que devuelve la IA (ej. "1..*", "MUCHOS", "COMPOSITION") a los enums
 * del diagrama. Cualquier valor no reconocido cae al default seguro ("UNO" / "ASOCIACION"). */
export function parseTipoRelacionUml(str: string | undefined): TipoRelacionUml {
  if (!str) return "ASOCIACION"
  const s = str.trim().toUpperCase().replace(/[()[\]]/g, "")
  if (s === "COMPOSICION" || s === "COMPOSITION") return "COMPOSICION"
  if (s === "AGREGACION" || s === "AGGREGATION") return "AGREGACION"
  if (s === "HERENCIA" || s === "GENERALIZACION" || s === "INHERITANCE" || s === "GENERALIZATION") return "HERENCIA"
  return "ASOCIACION"
}

export function parseLadoMultiplicidad(str: string): LadoMultiplicidad {
  if (!str) return "UNO"
  const s = str.trim().toUpperCase().replace(/[()[\]]/g, "")
  if (s === "1" || s === "UNO" || s === "ONE") return "UNO"
  if (s === "0..1" || s === "CERO_O_UNO") return "CERO_O_UNO"
  if (
    s === "1..*" ||
    s === "1..N" ||
    s === "1..M" ||
    s === "UNO_O_MAS" ||
    s === "MUCHOS" ||
    s === "MUCHAS" ||
    s === "VARIOS" ||
    s === "VARIAS" ||
    s === "N" ||
    s === "M" ||
    s === "MANY"
  ) {
    return "UNO_O_MAS"
  }
  if (s === "*" || s === "0..*" || s === "0..N" || s === "CERO_O_MAS" || s === "CERO_A_MUCHOS") {
    return "CERO_O_MAS"
  }
  return "UNO"
}
