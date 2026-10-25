import type { EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { BASE_PACKAGE, toPascalCase, toCamelCase, toKebabCase, toJavaType } from "./nombres"
import { asegurarAtributosConPk, obtenerTipoId, type RelacionesPorEntidad } from "./entidadJpa"

/** Capa controller: endpoints REST + Swagger por tabla. Parte de `springBootGenerator.ts`. */

export function generarControllerJava(
  entidad: EntidadDiagramaResponse,
  rels?: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)
  const singularPath = entidad.nombre.trim().replace(/[_-\s]+/g, "-").toLowerCase()
  const pluralPath = toKebabCase(entidad.nombre)
  const pathExpr = singularPath === pluralPath 
    ? `"/api/${pluralPath}"` 
    : `{"/api/${pluralPath}", "/api/${singularPath}"}`
  const atributos = asegurarAtributosConPk(entidad)
  const mtoRels = rels?.manyToOne ?? []

  const primarySearchAttr = atributos.find((a) => a.nombre.toLowerCase() === "nombre") ||
    atributos.find((a) => toJavaType(a.tipoSql) === "String" && !a.esPk)

  const requestParams: string[] = []
  const filterChecks: string[] = []

  if (primarySearchAttr) {
    requestParams.push(`            @RequestParam(required = false) String buscar`)
    filterChecks.push(`        if (buscar != null && !buscar.isBlank()) {
            return ResponseEntity.ok(service.buscar(buscar));
        }`)
  }

  for (const rel of mtoRels) {
    const camelFk = `${toCamelCase(rel.fieldName)}Id`
    const pascalRel = toPascalCase(rel.fieldName)
    const altFk = camelFk.endsWith("sId")
      ? camelFk.replace(/sId$/, "Id")
      : `${camelFk.replace(/Id$/, "")}sId`

    if (altFk !== camelFk) {
      requestParams.push(`            @RequestParam(required = false) Long ${camelFk}`)
      requestParams.push(`            @RequestParam(required = false) Long ${altFk}`)
      filterChecks.push(`        Long target_${camelFk} = ${camelFk} != null ? ${camelFk} : ${altFk};
        if (target_${camelFk} != null) {
            return ResponseEntity.ok(service.listarPor${pascalRel}(target_${camelFk}));
        }`)
    } else {
      requestParams.push(`            @RequestParam(required = false) Long ${camelFk}`)
      filterChecks.push(`        if (${camelFk} != null) {
            return ResponseEntity.ok(service.listarPor${pascalRel}(${camelFk}));
        }`)
    }
  }

  const paramsSignature = requestParams.length > 0 ? `\n${requestParams.join(",\n")}\n    ` : ""
  const filterBody = filterChecks.length > 0 ? `${filterChecks.join("\n")}\n        ` : ""

  return `package ${BASE_PACKAGE}.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import ${BASE_PACKAGE}.dto.${className}Request;
import ${BASE_PACKAGE}.dto.${className}Response;
import ${BASE_PACKAGE}.service.${className}Service;

@RestController
@RequestMapping(${pathExpr})
@Tag(name = "${className}", description = "Operaciones CRUD para ${className}")
public class ${className}Controller {

    private final ${className}Service service;

    public ${className}Controller(${className}Service service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar todos los registros de ${className} con filtros opcionales")
    public ResponseEntity<List<${className}Response>> listarTodos(${paramsSignature}) {
        ${filterBody}return ResponseEntity.ok(service.listarTodos());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener ${className} por identificador")
    public ResponseEntity<${className}Response> obtenerPorId(@PathVariable ${idType} id) {
        return ResponseEntity.ok(service.obtenerPorId(id));
    }

    @PostMapping
    @Operation(summary = "Crear nuevo registro de ${className}")
    public ResponseEntity<${className}Response> crear(@Valid @RequestBody ${className}Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar registro existente de ${className}")
    public ResponseEntity<${className}Response> actualizar(@PathVariable ${idType} id, @Valid @RequestBody ${className}Request request) {
        return ResponseEntity.ok(service.actualizar(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar registro de ${className}")
    public ResponseEntity<Void> eliminar(@PathVariable ${idType} id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
`
}
