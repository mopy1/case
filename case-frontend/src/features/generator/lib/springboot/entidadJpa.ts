import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { toJavaType } from "./nombres"

/** Tipos internos de relaciones JPA y normalización de la PK de cada entidad. Parte de `springBootGenerator.ts`. */

// Estructura interna para relaciones JPA
export interface ManyToOneRel {
  targetEntityName: string
  fieldName: string
  columnName: string
  nullable: boolean
}

export interface OneToManyRel {
  targetEntityName: string
  fieldName: string
  mappedBy: string
}

export interface RelacionesPorEntidad {
  manyToOne: ManyToOneRel[]
  oneToMany: OneToManyRel[]
}

export function asegurarAtributosConPk(entidad: EntidadDiagramaResponse): AtributoEntidadResponse[] {
  const lista = entidad.atributos.map((a) => ({ ...a }))
  const pks = lista.filter((a) => a.esPk)

  if (pks.length > 1) {
    const idAttr = lista.find((a) => a.nombre.toLowerCase() === "id")
    if (idAttr) {
      return lista.map((a) => ({
        ...a,
        esPk: a.nombre.toLowerCase() === "id",
      }))
    } else {
      const normalizados = lista.map((a) => ({ ...a, esPk: false }))
      normalizados.unshift({
        id: 0,
        entidadId: entidad.id,
        nombre: "id",
        tipoSql: "BIGSERIAL",
        esPk: true,
        esFk: false,
        referenciaEntidadId: null,
        referenciaEntidadNombre: null,
        nullable: false,
      })
      return normalizados
    }
  }

  if (pks.length === 0) {
    lista.unshift({
      id: 0,
      entidadId: entidad.id,
      nombre: "id",
      tipoSql: "BIGSERIAL",
      esPk: true,
      esFk: false,
      referenciaEntidadId: null,
      referenciaEntidadNombre: null,
      nullable: false,
    })
    return lista
  }

  return lista
}

export function obtenerTipoId(entidad: EntidadDiagramaResponse): string {
  const attrs = asegurarAtributosConPk(entidad)
  const pk = attrs.find((a) => a.esPk)
  return pk ? toJavaType(pk.tipoSql) : "Long"
}
