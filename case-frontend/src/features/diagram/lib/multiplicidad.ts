import type { LadoMultiplicidad } from "../types/diagram.types"

export const OPCIONES_LADO: { value: LadoMultiplicidad; label: string }[] = [
  { value: "UNO", label: "1" },
  { value: "CERO_O_UNO", label: "0..1" },
  { value: "UNO_O_MAS", label: "1..*" },
  { value: "CERO_O_MAS", label: "0..*" },
]

export function etiquetaLado(lado: LadoMultiplicidad): string {
  return OPCIONES_LADO.find((o) => o.value === lado)!.label
}

function esUno(lado: LadoMultiplicidad): boolean {
  return lado === "UNO" || lado === "CERO_O_UNO"
}

/** N:M real — ambos lados admiten más de una instancia relacionada. Dispara la detección de la
 * tabla intermedia (`AsociacionClase`, ver `useDiagramCanvas`). */
export function esMuchosAMuchos(origen: LadoMultiplicidad, destino: LadoMultiplicidad): boolean {
  return !esUno(origen) && !esUno(destino)
}
