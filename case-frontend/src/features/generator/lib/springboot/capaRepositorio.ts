import type { EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { BASE_PACKAGE, toPascalCase, toCamelCase, toJavaType } from "./nombres"
import { asegurarAtributosConPk, obtenerTipoId, type RelacionesPorEntidad } from "./entidadJpa"

/** Capa repository: interfaz JpaRepository por tabla. Parte de `springBootGenerator.ts`. */

export function generarRepositoryJava(
  entidad: EntidadDiagramaResponse,
  rels?: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)
  const atributos = asegurarAtributosConPk(entidad)
  const mtoRels = rels?.manyToOne ?? []

  const queryMethods: string[] = []

  for (const rel of mtoRels) {
    const pascalRel = toPascalCase(rel.fieldName)
    const camelFk = `${toCamelCase(rel.fieldName)}Id`
    queryMethods.push(`    List<${className}> findBy${pascalRel}Id(Long ${camelFk});`)
  }

  const stringAttrs = atributos
    .filter((a) => toJavaType(a.tipoSql) === "String" && !a.esPk)
    .slice(0, 3)

  for (const attr of stringAttrs) {
    const pascalAttr = toPascalCase(attr.nombre)
    const camelAttr = toCamelCase(attr.nombre)
    queryMethods.push(`    List<${className}> findBy${pascalAttr}ContainingIgnoreCase(String ${camelAttr});`)
  }

  return `package ${BASE_PACKAGE}.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${BASE_PACKAGE}.model.${className};

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${idType}> {
${queryMethods.length > 0 ? queryMethods.join("\n") + "\n" : ""}
}
`
}
