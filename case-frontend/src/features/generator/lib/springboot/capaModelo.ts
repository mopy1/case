import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { BASE_PACKAGE, toPascalCase, toCamelCase, toJavaType, isSameForeignKey } from "./nombres"
import { asegurarAtributosConPk, type RelacionesPorEntidad } from "./entidadJpa"

/** Capa model: entidad JPA por tabla. Parte de `springBootGenerator.ts`. */

export function generarModelJava(
  entidad: EntidadDiagramaResponse,
  relaciones: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const tableName = entidad.nombre.toLowerCase()
  const atributos = asegurarAtributosConPk(entidad)

  const isFkColumn = (attr: AtributoEntidadResponse) => {
    if (attr.esPk) return false
    return relaciones.manyToOne.some(
      (rel) =>
        attr.nombre.toLowerCase() === rel.columnName.toLowerCase() ||
        isSameForeignKey(attr.nombre, rel.fieldName, rel.columnName)
    )
  }

  // Columnas escalares (excluyendo FKs gestionadas por relaciones JPA)
  const scalarAttrs = atributos.filter((a) => !isFkColumn(a))

  const lines: string[] = []
  lines.push(`package ${BASE_PACKAGE}.model;\n`)
  lines.push(`import jakarta.persistence.*;`)
  lines.push(`import java.math.BigDecimal;`)
  lines.push(`import java.time.LocalDate;`)
  lines.push(`import java.time.LocalDateTime;`)
  lines.push(`import java.time.LocalTime;`)
  lines.push(`import java.util.List;`)
  lines.push(`import java.util.ArrayList;\n`)
  lines.push(`@Entity`)
  lines.push(`@Table(name = "${tableName}")`)
  lines.push(`public class ${className} {\n`)

  // Columnas escalares
  for (const attr of scalarAttrs) {
    const fieldName = toCamelCase(attr.nombre)
    const javaType = toJavaType(attr.tipoSql)

    if (attr.esPk) {
      lines.push(`    @Id`)
      if (javaType === "Long" || javaType === "Integer") {
        lines.push(`    @GeneratedValue(strategy = GenerationType.IDENTITY)`)
      }
    }
    const nullablePart = !attr.nullable ? ", nullable = false" : ""
    lines.push(`    @Column(name = "${attr.nombre.toLowerCase()}"${nullablePart})`)
    lines.push(`    private ${javaType} ${fieldName};\n`)
  }

  // Relaciones @ManyToOne
  for (const rel of relaciones.manyToOne) {
    lines.push(`    @ManyToOne(fetch = FetchType.LAZY)`)
    lines.push(`    @JoinColumn(name = "${rel.columnName}")`)
    lines.push(`    private ${rel.targetEntityName} ${rel.fieldName};\n`)
  }

  // Relaciones @OneToMany
  for (const rel of relaciones.oneToMany) {
    lines.push(`    @OneToMany(mappedBy = "${rel.mappedBy}", cascade = CascadeType.ALL)`)
    lines.push(`    private List<${rel.targetEntityName}> ${rel.fieldName} = new ArrayList<>();\n`)
  }

  // Constructor sin argumentos (JPA)
  lines.push(`    public ${className}() {}\n`)

  // Getters y Setters de columnas escalares
  for (const attr of scalarAttrs) {
    const fieldName = toCamelCase(attr.nombre)
    const methodName = toPascalCase(attr.nombre)
    const javaType = toJavaType(attr.tipoSql)

    lines.push(`    public ${javaType} get${methodName}() {`)
    lines.push(`        return this.${fieldName};`)
    lines.push(`    }\n`)

    lines.push(`    public void set${methodName}(${javaType} ${fieldName}) {`)
    lines.push(`        this.${fieldName} = ${fieldName};`)
    lines.push(`    }\n`)
  }

  // Getters y Setters de @ManyToOne
  for (const rel of relaciones.manyToOne) {
    const methodName = toPascalCase(rel.fieldName)
    lines.push(`    public ${rel.targetEntityName} get${methodName}() {`)
    lines.push(`        return this.${rel.fieldName};`)
    lines.push(`    }\n`)

    lines.push(`    public void set${methodName}(${rel.targetEntityName} ${rel.fieldName}) {`)
    lines.push(`        this.${rel.fieldName} = ${rel.fieldName};`)
    lines.push(`    }\n`)
  }

  // Getters y Setters de @OneToMany
  for (const rel of relaciones.oneToMany) {
    const methodName = toPascalCase(rel.fieldName)
    lines.push(`    public List<${rel.targetEntityName}> get${methodName}() {`)
    lines.push(`        return this.${rel.fieldName};`)
    lines.push(`    }\n`)

    lines.push(`    public void set${methodName}(List<${rel.targetEntityName}> ${rel.fieldName}) {`)
    lines.push(`        this.${rel.fieldName} = ${rel.fieldName};`)
    lines.push(`    }\n`)
  }

  lines.push(`}`)
  return lines.join("\n")
}
