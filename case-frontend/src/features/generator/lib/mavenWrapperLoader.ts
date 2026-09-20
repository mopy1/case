import mvnwScript from "../templates/mvnw.template?raw"
import mvnwCmdScript from "../templates/mvnw.cmd.template?raw"
import mavenWrapperProps from "../templates/maven-wrapper.properties.template?raw"
import type { ArchivoGenerado } from "../types/generator.types"

/**
 * Retorna los archivos del Maven Wrapper para que el proyecto descargado
 * funcione inmediatamente con ./mvnw spring-boot:run sin instalar Maven.
 */
export function generarArchivosMavenWrapper(): ArchivoGenerado[] {
  return [
    {
      ruta: "mvnw",
      contenido: mvnwScript,
      tipo: "CONFIG",
    },
    {
      ruta: "mvnw.cmd",
      contenido: mvnwCmdScript,
      tipo: "CONFIG",
    },
    {
      ruta: ".mvn/wrapper/maven-wrapper.properties",
      contenido: mavenWrapperProps,
      tipo: "CONFIG",
    },
  ]
}
