import type { LadoMultiplicidad } from "@/features/diagram/types/diagram.types"
import type { AttributeSuggestion, EntityDeleteSuggestion, EntitySuggestion, RelationSuggestion } from "../types/copilot.types"
import { findMultipleSafeEntityPositions, type EntityPosition } from "@/features/diagram/lib/positionGuide"
import { parseLadoMultiplicidad, parseTipoRelacionUml } from "./copilotUmlParsers"

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
  // Grupo 4 (opcional): tipo UML de la relación — ASOCIACION (default si no viene),
  // COMPOSICION, AGREGACION o HERENCIA. Ver buildSystemContext para la convención de que el
  // ORIGEN es el "todo"/subclase y el DESTINO es la "parte"/superclase.
  const relRegex =
    /(?:CREAR_RELACION|ACTUALIZAR_RELACION):\s*\[?([a-zA-Z0-9_]+)\]?\s*(?:->|a|-)\s*\[?([a-zA-Z0-9_]+)\]?(?:\s*\(([^)]+)\))?(?:\s*\[?(ASOCIACION|COMPOSICION|AGREGACION|HERENCIA|GENERALIZACION)\]?)?/gi
  const matches = [...text.matchAll(relRegex)]

  for (const m of matches) {
    const origen = m[1].trim()
    const destino = m[2].trim()
    let multiplicidadOrigen: LadoMultiplicidad = "UNO"
    let multiplicidadDestino: LadoMultiplicidad = "UNO_O_MAS"

    if (m[3]) {
      const trimmedSpec = m[3].trim()
      const parts = trimmedSpec.split(/\s+\ba\b\s+|\s+\bto\b\s+|\s*:\s*|\s*->\s*|\s+-\s+/i)
      if (parts.length >= 2) {
        multiplicidadOrigen = parseLadoMultiplicidad(parts[0])
        multiplicidadDestino = parseLadoMultiplicidad(parts[1])
      }
    }

    const tipo = parseTipoRelacionUml(m[4])

    results.push({ origen, destino, multiplicidadOrigen, multiplicidadDestino, tipo, creada: false })
  }

  return results
}

export function parseAttributeSuggestions(text: string): AttributeSuggestion[] {
  const results: AttributeSuggestion[] = []
  const regex = /(?:AGREGAR_ATRIBUTO|CREAR_ATRIBUTO):\s*\[?([a-zA-Z0-9_]+)\]?\s*\[?([^\]\n]+)\]?/gi
  const matches = [...text.matchAll(regex)]

  for (const m of matches) {
    const tabla = m[1].trim()
    const rawAttrs = m[2].trim().split(",")
    for (const raw of rawAttrs) {
      const parts = raw.trim().split(":")
      const nombre = parts[0]?.trim()
      if (!nombre) continue
      const tipoSql = (parts[1]?.trim() || "VARCHAR").toUpperCase()
      const isPk = parts.some((p) => /pk|primary/i.test(p))
      const nullable = !isPk && !parts.some((p) => /not_null|required|no_nulo/i.test(p))

      results.push({
        tabla,
        nombre,
        tipoSql,
        esPk: isPk,
        esFk: false,
        nullable,
        creada: false,
      })
    }
  }

  return results
}

export function parseEntityDeleteSuggestions(text: string): EntityDeleteSuggestion[] {
  const results: EntityDeleteSuggestion[] = []
  const regex = /(?:ELIMINAR_TABLA|BORRAR_TABLA):\s*\[?([a-zA-Z0-9_]+)\]?/gi
  const matches = [...text.matchAll(regex)]

  for (const m of matches) {
    const tabla = m[1].trim()
    if (tabla && !results.some((r) => r.tabla.toLowerCase() === tabla.toLowerCase())) {
      results.push({ tabla, eliminada: false })
    }
  }

  return results
}
