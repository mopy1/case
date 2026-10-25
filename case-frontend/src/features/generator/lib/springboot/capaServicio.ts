import type { AtributoEntidadResponse, EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { BASE_PACKAGE, toPascalCase, toCamelCase, toJavaType, isSameForeignKey } from "./nombres"
import { asegurarAtributosConPk, obtenerTipoId, type RelacionesPorEntidad } from "./entidadJpa"

/** Capa service: CRUD transaccional por tabla. Parte de `springBootGenerator.ts`. */

export function generarServiceJava(
  entidad: EntidadDiagramaResponse,
  rels?: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)
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

  const scalarNonPkAttrs = atributos.filter((a) => !a.esPk && !isFkColumn(a))

  const scalarSetters = scalarNonPkAttrs
    .map(
      (a) =>
        `        entity.set${toPascalCase(a.nombre)}(request.${toCamelCase(a.nombre)}());`
    )
    .join("\n")

  const uniqueForeignTargets = Array.from(
    new Set(mtoRels.map((r) => r.targetEntityName).filter((t) => t !== className))
  )

  const repoFields = uniqueForeignTargets
    .map((target) => `    private final ${target}Repository ${toCamelCase(target)}Repository;`)
    .join("\n")

  const ctorParams = [`${className}Repository repository`]
    .concat(uniqueForeignTargets.map((t) => `${t}Repository ${toCamelCase(t)}Repository`))
    .join(", ")

  const ctorAssignments = [`        this.repository = repository;`]
    .concat(uniqueForeignTargets.map((t) => `        this.${toCamelCase(t)}Repository = ${toCamelCase(t)}Repository;`))
    .join("\n")

  const relImports = uniqueForeignTargets
    .map(
      (target) =>
        `import ${BASE_PACKAGE}.model.${target};\nimport ${BASE_PACKAGE}.repository.${target}Repository;`
    )
    .join("\n")

  const relSetters = mtoRels
    .map((rel) => {
      const fkGetter = `request.${toCamelCase(rel.fieldName)}Id()`
      const repoVar = rel.targetEntityName === className ? "this.repository" : `this.${toCamelCase(rel.targetEntityName)}Repository`
      return `        if (${fkGetter} != null) {
            ${rel.targetEntityName} ${rel.fieldName} = ${repoVar}.findById(${fkGetter})
                    .orElseThrow(() -> new ResourceNotFoundException("${rel.targetEntityName} no encontrado con id: " + ${fkGetter}));
            entity.set${toPascalCase(rel.fieldName)}(${rel.fieldName});
        }`
    })
    .join("\n")

  const allSetters = [scalarSetters, relSetters].filter(Boolean).join("\n")

  const filterMethods: string[] = []

  for (const rel of mtoRels) {
    const pascalRel = toPascalCase(rel.fieldName)
    const camelFk = `${toCamelCase(rel.fieldName)}Id`
    filterMethods.push(`    @Transactional(readOnly = true)
    public List<${className}Response> listarPor${pascalRel}(Long ${camelFk}) {
        return repository.findBy${pascalRel}Id(${camelFk}).stream()
                .map(${className}Response::from)
                .toList();
    }`)
  }

  const primarySearchAttr = atributos.find((a) => a.nombre.toLowerCase() === "nombre") ||
    atributos.find((a) => toJavaType(a.tipoSql) === "String" && !a.esPk)

  if (primarySearchAttr) {
    const pascalAttr = toPascalCase(primarySearchAttr.nombre)
    filterMethods.push(`    @Transactional(readOnly = true)
    public List<${className}Response> buscar(String texto) {
        if (texto == null || texto.isBlank()) {
            return listarTodos();
        }
        return repository.findBy${pascalAttr}ContainingIgnoreCase(texto.trim()).stream()
                .map(${className}Response::from)
                .toList();
    }`)
  }

  const extraMethods = filterMethods.length > 0 ? "\n" + filterMethods.join("\n\n") : ""

  return `package ${BASE_PACKAGE}.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ${BASE_PACKAGE}.core.exception.ResourceNotFoundException;
import ${BASE_PACKAGE}.dto.${className}Request;
import ${BASE_PACKAGE}.dto.${className}Response;
import ${BASE_PACKAGE}.model.${className};
import ${BASE_PACKAGE}.repository.${className}Repository;
${relImports ? relImports + "\n" : ""}
@Service
@Transactional
public class ${className}Service {

    private final ${className}Repository repository;
${repoFields ? repoFields + "\n" : ""}
    public ${className}Service(${ctorParams}) {
${ctorAssignments}
    }

    @Transactional(readOnly = true)
    public List<${className}Response> listarTodos() {
        return repository.findAll().stream()
                .map(${className}Response::from)
                .toList();
    }
${extraMethods}

    @Transactional(readOnly = true)
    public ${className}Response obtenerPorId(${idType} id) {
        ${className} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("${className} no encontrado con id: " + id));
        return ${className}Response.from(entity);
    }

    public ${className}Response crear(${className}Request request) {
        ${className} entity = new ${className}();
${allSetters}
        return ${className}Response.from(repository.save(entity));
    }

    public ${className}Response actualizar(${idType} id, ${className}Request request) {
        ${className} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("${className} no encontrado con id: " + id));
${allSetters}
        return ${className}Response.from(repository.save(entity));
    }

    public void eliminar(${idType} id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("${className} no encontrado con id: " + id);
        }
        repository.deleteById(id);
    }
}
`
}
