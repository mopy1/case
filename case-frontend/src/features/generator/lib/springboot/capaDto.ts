import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { BASE_PACKAGE, toPascalCase, toCamelCase, toJavaType, isSameForeignKey } from "./nombres"
import { asegurarAtributosConPk, type RelacionesPorEntidad } from "./entidadJpa"

/** Capa dto: Request y Response por tabla. Parte de `springBootGenerator.ts`. */

export function generarRequestDtoJava(
  entidad: EntidadDiagramaResponse,
  rels?: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const atributos = asegurarAtributosConPk(entidad)
  const mtoRels = rels?.manyToOne ?? []

  const isFkColumn = (attr: AtributoEntidadResponse) => {
    if (attr.esPk) return false
    return mtoRels.some(
      (rel) =>
        attr.nombre.toLowerCase() === rel.columnName.toLowerCase() ||
        isSameForeignKey(attr.nombre, rel.fieldName, rel.columnName)
    )
  }

  const noPkAttrs = atributos.filter((a) => !a.esPk && !isFkColumn(a))

  const lines: string[] = []
  lines.push(`package ${BASE_PACKAGE}.dto;\n`)
  lines.push(`import jakarta.validation.constraints.*;`)
  lines.push(`import java.math.BigDecimal;`)
  lines.push(`import java.time.LocalDate;`)
  lines.push(`import java.time.LocalDateTime;`)
  lines.push(`import java.time.LocalTime;\n`)
  lines.push(`public record ${className}Request(`)

  const fields: string[] = []

  for (const attr of noPkAttrs) {
    const fieldName = toCamelCase(attr.nombre)
    const javaType = toJavaType(attr.tipoSql)

    let validation = ""
    if (!attr.nullable) {
      if (javaType === "String") {
        validation = `@NotBlank(message = "${fieldName} no puede estar vacío") `
      } else {
        validation = `@NotNull(message = "${fieldName} es obligatorio") `
      }
    }
    fields.push(`    ${validation}${javaType} ${fieldName}`)
  }

  for (const rel of mtoRels) {
    const fkFieldName = `${toCamelCase(rel.fieldName)}Id`
    const validation = !rel.nullable ? `@NotNull(message = "${fkFieldName} es obligatorio") ` : ""
    fields.push(`    ${validation}Long ${fkFieldName}`)
  }

  lines.push(fields.join(",\n"))
  lines.push(`) {}\n`)
  return lines.join("\n")
}

export function generarResponseDtoJava(
  entidad: EntidadDiagramaResponse,
  rels?: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const atributos = asegurarAtributosConPk(entidad)
  const mtoRels = rels?.manyToOne ?? []

  const isFkColumn = (attr: AtributoEntidadResponse) => {
    if (attr.esPk) return false
    return mtoRels.some(
      (rel) =>
        attr.nombre.toLowerCase() === rel.columnName.toLowerCase() ||
        isSameForeignKey(attr.nombre, rel.fieldName, rel.columnName)
    )
  }

  const scalarAttrs = atributos.filter((a) => !isFkColumn(a))

  const lines: string[] = []
  lines.push(`package ${BASE_PACKAGE}.dto;\n`)
  lines.push(`import java.math.BigDecimal;`)
  lines.push(`import java.time.LocalDate;`)
  lines.push(`import java.time.LocalDateTime;`)
  lines.push(`import java.time.LocalTime;`)
  lines.push(`import ${BASE_PACKAGE}.model.${className};\n`)
  lines.push(`public record ${className}Response(`)

  const fields: string[] = []
  const fromArgs: string[] = []

  for (const attr of scalarAttrs) {
    fields.push(`    ${toJavaType(attr.tipoSql)} ${toCamelCase(attr.nombre)}`)
    fromArgs.push(`            entity.get${toPascalCase(attr.nombre)}()`)
  }

  for (const rel of mtoRels) {
    const fkFieldName = `${toCamelCase(rel.fieldName)}Id`
    fields.push(`    Long ${fkFieldName}`)
    fromArgs.push(
      `            entity.get${toPascalCase(rel.fieldName)}() != null ? entity.get${toPascalCase(rel.fieldName)}().getId() : null`
    )
  }

  lines.push(fields.join(",\n"))
  lines.push(`) {`)
  lines.push(`    public static ${className}Response from(${className} entity) {`)
  lines.push(`        return new ${className}Response(`)
  lines.push(fromArgs.join(",\n"))
  lines.push(`        );`)
  lines.push(`    }`)
  lines.push(`}\n`)
  return lines.join("\n")
}
