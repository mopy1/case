import type { DiagramaResponse } from "@/features/diagram/types/diagram.types"
import type { ArchivoGenerado, GeneradorPreviewResponse } from "../types/generator.types"
import { generarArchivosMavenWrapper } from "./mavenWrapperLoader"
import { BASE_PATH, toPascalCase, sanitizarNombre } from "./springboot/nombres"
import { resolverRelacionesJPA } from "./springboot/relacionesJpa"
import { generarPomXml } from "./springboot/pomXml"
import { generarApplicationProperties, generarApplicationPostgresProperties, generarDockerComposeYaml, generarReadme } from "./springboot/archivosConfig"
import { generarApplicationJava, generarCorsConfigJava, generarOpenApiConfigJava, generarGlobalExceptionHandlerJava, generarResourceNotFoundExceptionJava } from "./springboot/archivosCore"
import { generarModelJava } from "./springboot/capaModelo"
import { generarRepositoryJava } from "./springboot/capaRepositorio"
import { generarRequestDtoJava, generarResponseDtoJava } from "./springboot/capaDto"
import { generarServiceJava } from "./springboot/capaServicio"
import { generarControllerJava } from "./springboot/capaControlador"

/** Generador client-side de un backend Spring Boot 3.4 (Java 21) a partir del diagrama: arma la
 * lista de archivos (config, core y las 6 capas por entidad). Las plantillas viven en
 * `./springboot/` — este archivo solo orquesta. */

export function generarProyectoSpringBoot(
  nombreProyecto: string,
  diagrama: DiagramaResponse
): GeneradorPreviewResponse {
  const archivos: ArchivoGenerado[] = []
  const appName = sanitizarNombre(nombreProyecto)

  // 1. Archivos Raíz y Configuración
  archivos.push({
    ruta: "pom.xml",
    contenido: generarPomXml(appName),
    tipo: "CONFIG",
  })
  archivos.push({
    ruta: "README.md",
    contenido: generarReadme(nombreProyecto, diagrama.entidades),
    tipo: "DOC",
  })
  archivos.push({
    ruta: "docker-compose.yml",
    contenido: generarDockerComposeYaml(appName),
    tipo: "CONFIG",
  })
  archivos.push({
    ruta: "src/main/resources/application.properties",
    contenido: generarApplicationProperties(appName),
    tipo: "CONFIG",
  })
  archivos.push({
    ruta: "src/main/resources/application-postgres.properties",
    contenido: generarApplicationPostgresProperties(appName),
    tipo: "CONFIG",
  })

  // Maven Wrapper (para ejecución directa con ./mvnw sin instalar Maven)
  archivos.push(...generarArchivosMavenWrapper())

  // 2. Archivos Core del Backend
  archivos.push({
    ruta: `${BASE_PATH}Application.java`,
    contenido: generarApplicationJava(),
    tipo: "JAVA",
  })
  archivos.push({
    ruta: `${BASE_PATH}core/config/CorsConfig.java`,
    contenido: generarCorsConfigJava(),
    tipo: "JAVA",
  })
  archivos.push({
    ruta: `${BASE_PATH}core/config/OpenApiConfig.java`,
    contenido: generarOpenApiConfigJava(nombreProyecto),
    tipo: "JAVA",
  })
  archivos.push({
    ruta: `${BASE_PATH}core/exception/GlobalExceptionHandler.java`,
    contenido: generarGlobalExceptionHandlerJava(),
    tipo: "JAVA",
  })
  archivos.push({
    ruta: `${BASE_PATH}core/exception/ResourceNotFoundException.java`,
    contenido: generarResourceNotFoundExceptionJava(),
    tipo: "JAVA",
  })

  // 3. Resolución de Relaciones JPA y Capas por Entidad
  const relacionesMap = resolverRelacionesJPA(diagrama.entidades, diagrama.relaciones)

  for (const entidad of diagrama.entidades) {
    const className = toPascalCase(entidad.nombre)
    const rels = relacionesMap.get(entidad.id) ?? { manyToOne: [], oneToMany: [] }

    archivos.push({
      ruta: `${BASE_PATH}model/${className}.java`,
      contenido: generarModelJava(entidad, rels),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}repository/${className}Repository.java`,
      contenido: generarRepositoryJava(entidad, rels),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}dto/${className}Request.java`,
      contenido: generarRequestDtoJava(entidad, rels),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}dto/${className}Response.java`,
      contenido: generarResponseDtoJava(entidad, rels),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}service/${className}Service.java`,
      contenido: generarServiceJava(entidad, rels),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}controller/${className}Controller.java`,
      contenido: generarControllerJava(entidad, rels),
      tipo: "JAVA",
    })
  }

  const nombresEntidades = diagrama.entidades.map((e) => toPascalCase(e.nombre))

  return {
    nombreProyecto,
    totalArchivos: archivos.length,
    entidades: nombresEntidades,
    archivos,
  }
}
