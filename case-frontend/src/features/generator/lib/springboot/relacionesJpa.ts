import type { EntidadDiagramaResponse, RelacionDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { toPascalCase, toCamelCase, toSnakeCase, toPlural, normalizeIdentifier, isSameForeignKey } from "./nombres"
import type { RelacionesPorEntidad } from "./entidadJpa"

/** Resolución de @ManyToOne/@OneToMany a partir de FKs y relaciones del diagrama. Parte de `springBootGenerator.ts`. */

/**
 * Resuelve las relaciones JPA (@ManyToOne y @OneToMany) a partir de:
 * 1. Atributos con FK explícita (esFk = true o referenciaEntidadId/Nombre)
 * 2. Relaciones del diagrama (multiplicidad 1:N o N:M)
 */
export function resolverRelacionesJPA(
  entidades: EntidadDiagramaResponse[],
  relaciones: RelacionDiagramaResponse[]
): Map<number, RelacionesPorEntidad> {
  const mapa = new Map<number, RelacionesPorEntidad>()
  for (const e of entidades) {
    mapa.set(e.id, { manyToOne: [], oneToMany: [] })
  }

  const entidadPorId = new Map(entidades.map((e) => [e.id, e]))
  const entidadPorNombre = new Map(entidades.map((e) => [e.nombre.toLowerCase(), e]))

  // 1. Detección por atributos FK en las entidades
  for (const entidad of entidades) {
    const entidadRel = mapa.get(entidad.id)!
    for (const attr of entidad.atributos) {
      if (!attr.esFk && !attr.referenciaEntidadId && !attr.referenciaEntidadNombre) continue

      let destino = attr.referenciaEntidadId ? entidadPorId.get(attr.referenciaEntidadId) : undefined
      if (!destino && attr.referenciaEntidadNombre) {
        destino = entidadPorNombre.get(attr.referenciaEntidadNombre.toLowerCase())
      }
      if (!destino) {
        // Intentar deducir si el nombre de la columna termina en _id (ej: cliente_id -> cliente)
        const match = attr.nombre.match(/^(?:id_)?(.*?)(?:_id)?$/i)
        const baseNombre = match && match[1] ? match[1].toLowerCase() : ""
        if (baseNombre) {
          destino = entidadPorNombre.get(baseNombre)
          if (!destino) {
            destino = entidades.find((e) => normalizeIdentifier(e.nombre) === normalizeIdentifier(baseNombre))
          }
        }
      }

      if (destino) {
        const targetEntityName = toPascalCase(destino.nombre)
        // Extraer nombre de campo a partir de la columna (ej: cliente_id -> cliente)
        let fieldName = attr.nombre.replace(/^id_/i, "").replace(/_id$/i, "")
        fieldName = toCamelCase(fieldName)
        if (!fieldName || fieldName === "id") {
          fieldName = toCamelCase(destino.nombre)
        }

        // Evitar duplicados
        const alreadyHas = entidadRel.manyToOne.some(
          (m) =>
            m.columnName.toLowerCase() === attr.nombre.toLowerCase() ||
            isSameForeignKey(m.fieldName, fieldName, attr.nombre)
        )

        if (!alreadyHas) {
          entidadRel.manyToOne.push({
            targetEntityName,
            fieldName,
            columnName: attr.nombre.toLowerCase(),
            nullable: attr.nullable,
          })

          // Inyectar el @OneToMany inverso en la entidad destino
          const destinoRel = mapa.get(destino.id)
          if (destinoRel) {
            const listFieldName = toCamelCase(toPlural(entidad.nombre))
            if (!destinoRel.oneToMany.some((o) => o.fieldName === listFieldName)) {
              destinoRel.oneToMany.push({
                targetEntityName: toPascalCase(entidad.nombre),
                fieldName: listFieldName,
                mappedBy: fieldName,
              })
            }
          }
        }
      }
    }
  }

  // 2. Detección por relaciones del diagrama no capturadas por atributos
  for (const rel of relaciones) {
    const origen = entidadPorId.get(rel.entidadOrigenId)
    const destino = entidadPorId.get(rel.entidadDestinoId)
    if (!origen || !destino) continue

    const esUnoOrigen = rel.multiplicidadOrigen === "UNO" || rel.multiplicidadOrigen === "CERO_O_UNO"
    const esMuchosOrigen = rel.multiplicidadOrigen === "UNO_O_MAS" || rel.multiplicidadOrigen === "CERO_O_MAS"
    const esUnoDestino = rel.multiplicidadDestino === "UNO" || rel.multiplicidadDestino === "CERO_O_UNO"
    const esMuchosDestino = rel.multiplicidadDestino === "UNO_O_MAS" || rel.multiplicidadDestino === "CERO_O_MAS"

    // Caso 1:N -> Destino es el lado "Muchos", Origen es el lado "Uno"
    if (esUnoOrigen && esMuchosDestino) {
      const destRel = mapa.get(destino.id)!
      const existingAttr = destino.atributos.find(
        (a) => isSameForeignKey(a.nombre, origen.nombre, `${toSnakeCase(origen.nombre)}_id`)
      )
      const colName = existingAttr ? existingAttr.nombre.toLowerCase() : `${toSnakeCase(origen.nombre)}_id`
      const rawFieldName = existingAttr
        ? existingAttr.nombre.replace(/^id_/i, "").replace(/_id$/i, "")
        : origen.nombre
      const fieldName = toCamelCase(rawFieldName) || toCamelCase(origen.nombre)

      const alreadyHas = destRel.manyToOne.some(
        (m) =>
          m.columnName.toLowerCase() === colName.toLowerCase() ||
          isSameForeignKey(m.fieldName, fieldName, colName)
      )

      if (!alreadyHas) {
        destRel.manyToOne.push({
          targetEntityName: toPascalCase(origen.nombre),
          fieldName,
          columnName: colName,
          nullable: existingAttr ? existingAttr.nullable : rel.multiplicidadOrigen === "CERO_O_UNO",
        })

        const origRel = mapa.get(origen.id)!
        const listFieldName = toCamelCase(toPlural(destino.nombre))
        if (!origRel.oneToMany.some((o) => o.fieldName === listFieldName)) {
          origRel.oneToMany.push({
            targetEntityName: toPascalCase(destino.nombre),
            fieldName: listFieldName,
            mappedBy: fieldName,
          })
        }
      }
    } else if (esMuchosOrigen && esUnoDestino) {
      // Caso N:1 -> Origen es el lado "Muchos", Destino es el lado "Uno"
      const origRel = mapa.get(origen.id)!
      const existingAttr = origen.atributos.find(
        (a) => isSameForeignKey(a.nombre, destino.nombre, `${toSnakeCase(destino.nombre)}_id`)
      )
      const colName = existingAttr ? existingAttr.nombre.toLowerCase() : `${toSnakeCase(destino.nombre)}_id`
      const rawFieldName = existingAttr
        ? existingAttr.nombre.replace(/^id_/i, "").replace(/_id$/i, "")
        : destino.nombre
      const fieldName = toCamelCase(rawFieldName) || toCamelCase(destino.nombre)

      const alreadyHas = origRel.manyToOne.some(
        (m) =>
          m.columnName.toLowerCase() === colName.toLowerCase() ||
          isSameForeignKey(m.fieldName, fieldName, colName)
      )

      if (!alreadyHas) {
        origRel.manyToOne.push({
          targetEntityName: toPascalCase(destino.nombre),
          fieldName,
          columnName: colName,
          nullable: existingAttr ? existingAttr.nullable : rel.multiplicidadDestino === "CERO_O_UNO",
        })

        const destRel = mapa.get(destino.id)!
        const listFieldName = toCamelCase(toPlural(origen.nombre))
        if (!destRel.oneToMany.some((o) => o.fieldName === listFieldName)) {
          destRel.oneToMany.push({
            targetEntityName: toPascalCase(origen.nombre),
            fieldName: listFieldName,
            mappedBy: fieldName,
          })
        }
      }
    } else if (rel.tipo === "HERENCIA" || (esUnoOrigen && esUnoDestino)) {
      // Caso 1:1 o HERENCIA -> Origen (hija) referencia a Destino (padre)
      const origRel = mapa.get(origen.id)!
      const existingAttr = origen.atributos.find(
        (a) => isSameForeignKey(a.nombre, destino.nombre, `${toSnakeCase(destino.nombre)}_id`)
      )
      const colName = existingAttr ? existingAttr.nombre.toLowerCase() : `${toSnakeCase(destino.nombre)}_id`
      const rawFieldName = existingAttr
        ? existingAttr.nombre.replace(/^id_/i, "").replace(/_id$/i, "")
        : destino.nombre
      const fieldName = toCamelCase(rawFieldName) || toCamelCase(destino.nombre)

      const alreadyHas = origRel.manyToOne.some(
        (m) =>
          m.columnName.toLowerCase() === colName.toLowerCase() ||
          isSameForeignKey(m.fieldName, fieldName, colName)
      )

      if (!alreadyHas) {
        origRel.manyToOne.push({
          targetEntityName: toPascalCase(destino.nombre),
          fieldName,
          columnName: colName,
          nullable: rel.tipo === "HERENCIA" ? false : (existingAttr ? existingAttr.nullable : rel.multiplicidadDestino === "CERO_O_UNO"),
        })
      }
    }
  }

  return mapa
}
