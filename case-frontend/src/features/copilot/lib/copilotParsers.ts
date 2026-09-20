import type { LadoMultiplicidad } from "@/features/diagram/types/diagram.types"
import type { AdrSuggestion, EntitySuggestion, RelationSuggestion } from "../types/copilot.types"
import { findMultipleSafeEntityPositions, type EntityPosition } from "@/features/diagram/lib/positionGuide"

export function parseAdrFromText(text: string): AdrSuggestion | undefined {
  const match = text.match(
    /(?:ADR_SUGERIDA|Acci[oó]n):\s*\[?([^\n\]]+)\]?\s*\n+(?:[•\-\*\s]*)(?:MOTIVO|Motivo(?: T[eé]cnico)?):\s*\[?([^\n\]]+)\]?/i
  )
  if (match) {
    return {
      accion: match[1].trim().replace(/^\[|\]$/g, ""),
      motivo: match[2].trim().replace(/^\[|\]$/g, ""),
    }
  }
  return undefined
}

export function parseLadoMultiplicidad(str: string): LadoMultiplicidad {
  const s = str.trim().toUpperCase()
  if (s === "1" || s === "UNO" || s === "ONE") return "UNO"
  if (s === "0..1" || s === "CERO_O_UNO") return "CERO_O_UNO"
  if (
    s === "1..*" ||
    s === "1..N" ||
    s === "1..M" ||
    s === "UNO_O_MAS" ||
    s === "MUCHOS" ||
    s === "VARIOS" ||
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

export function parseEntitySuggestions(text: string, existingEntities: EntityPosition[]): EntitySuggestion[] {
  const results: EntitySuggestion[] = []
  const entityRegex = /CREAR_TABLA:\s*\[?([a-zA-Z0-9_]+)\]?(?:\s*\(x:\s*(\d+),\s*y:\s*(\d+)\))?/gi
  const matches = [...text.matchAll(entityRegex)]
  if (matches.length === 0) return results

  const safePositions = findMultipleSafeEntityPositions(existingEntities, matches.length)

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const nombre = m[1].trim()
    const posX = m[2] ? Number(m[2]) : safePositions[i].posX
    const posY = m[3] ? Number(m[3]) : safePositions[i].posY

    const afterMatch = text.slice(m.index + m[0].length)
    const attrMatch = afterMatch.match(/^\s*ATRIBUTOS:\s*\[?([^\]\n]+)\]?/i)

    const atributos = [
      { nombre: "id", tipoSql: "BIGINT", esPk: true, esFk: false, nullable: false },
    ]

    if (attrMatch) {
      const rawAttrs = attrMatch[1].split(",")
      for (const raw of rawAttrs) {
        const parts = raw.trim().split(":")
        const attrName = parts[0]?.trim()
        if (!attrName || attrName.toLowerCase() === "id") continue
        const tipo = (parts[1]?.trim() || "VARCHAR").toUpperCase()
        const isPk = parts.some((p) => /pk|primary/i.test(p))
        atributos.push({
          nombre: attrName,
          tipoSql: tipo,
          esPk: isPk,
          esFk: false,
          nullable: !isPk,
        })
      }
    }

    results.push({ nombre, posX, posY, atributos, creada: false })
  }

  return results
}

export function parseRelationSuggestions(text: string): RelationSuggestion[] {
  const results: RelationSuggestion[] = []
  const relRegex = /(?:CREAR_RELACION|ACTUALIZAR_RELACION):\s*\[?([a-zA-Z0-9_]+)\]?\s*(?:->|a|-)\s*\[?([a-zA-Z0-9_]+)\]?(?:\s*\(([^)]+)\))?/gi
  const matches = [...text.matchAll(relRegex)]

  for (const m of matches) {
    const origen = m[1].trim()
    const destino = m[2].trim()
    let multiplicidadOrigen: LadoMultiplicidad = "UNO"
    let multiplicidadDestino: LadoMultiplicidad = "UNO_O_MAS"

    if (m[3]) {
      const trimmedSpec = m[3].trim()
      const colonParts = trimmedSpec.split(/\s*:\s*/)
      const toParts = trimmedSpec.split(/\s*(?:a|->|-)\s*/i)
      const parts = colonParts.length >= 2 ? colonParts : toParts
      if (parts.length >= 2) {
        multiplicidadOrigen = parseLadoMultiplicidad(parts[0])
        multiplicidadDestino = parseLadoMultiplicidad(parts[1])
      }
    }

    results.push({
      origen,
      destino,
      multiplicidadOrigen,
      multiplicidadDestino,
      creada: false,
    })
  }

  return results
}

export function cleanResponseText(rawText: string): string {
  return rawText
    .replace(/(?:##\s*ADR:?[\s\S]*$)/i, "")
    .replace(/(?:\*{0,2})ADR_SUGERIDA:?[\s\S]*$/i, "")
    .replace(/(?:\*{0,2})CREAR_TABLA:?[\s\S]*$/i, "")
    .replace(/(?:\*{0,2})(?:CREAR_RELACION|ACTUALIZAR_RELACION):?[\s\S]*$/i, "")
    .replace(/(?:\*{0,2})Acci[oó]n:?(?:\*{0,2})[\s\S]*$/i, "")
    .replace(/##\s*⚠️\s*Aclaración importante[\s\S]*$/i, "")
    .trim()
}

