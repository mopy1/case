import type { EntidadDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { toPascalCase, toKebabCase } from "./nombres"

/** Plantillas de application*.properties, docker-compose.yml y README.md. Parte de `springBootGenerator.ts`. */

export function generarApplicationProperties(appName: string): string {
  const dbName = appName.replace(/-/g, "_")
  return `spring.application.name=${appName}
server.port=8080

# ==============================================================================
# BASE DE DATOS: H2 EN MEMORIA (Zero-Config: ¡Arranca de inmediato sin instalar nada!)
# ==============================================================================
spring.datasource.url=jdbc:h2:mem:${dbName}_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect

# Hibernate DDL Auto
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Consola Web H2 (accesible en http://localhost:8080/h2-console)
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# Swagger / OpenAPI UI (accesible en http://localhost:8080/swagger-ui.html)
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/v3/api-docs

# Tolerancia JSON para clientes móviles e integraciones con IA
spring.jackson.deserialization.fail-on-unknown-properties=false
spring.jackson.serialization.write-dates-as-timestamps=false

# ==============================================================================
# ¿Prefieres usar PostgreSQL?
# 1. Inicia PostgreSQL con Docker: docker compose up -d
# 2. Arranca el backend con: ./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres
# ==============================================================================
`
}

export function generarApplicationPostgresProperties(appName: string): string {
  const dbName = appName.replace(/-/g, "_")
  return `spring.application.name=${appName}
server.port=8080

# Conexión a Base de Datos PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/${dbName}_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect

# Hibernate DDL Auto
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Swagger / OpenAPI UI
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/v3/api-docs

# Tolerancia JSON para clientes móviles e integraciones con IA
spring.jackson.deserialization.fail-on-unknown-properties=false
spring.jackson.serialization.write-dates-as-timestamps=false
`
}

export function generarDockerComposeYaml(appName: string): string {
  const dbName = appName.replace(/-/g, "_")
  return `services:
  postgres:
    image: postgres:16-alpine
    container_name: ${dbName}_postgres
    restart: always
    environment:
      POSTGRES_DB: ${dbName}_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`
}

export function generarReadme(projectName: string, entidades: EntidadDiagramaResponse[]): string {
  const lines: string[] = []
  lines.push(`# 🚀 ${projectName} — Backend Spring Boot\n`)
  lines.push(`Backend generado automáticamente con la **Herramienta CASE Colaborativa**.\n`)
  lines.push(`## ⚡ Cómo ejecutar inmediatamente (Zero-Config)\n`)
  lines.push(`No necesitas tener Maven ni PostgreSQL instalados en tu máquina. El proyecto incluye el **Maven Wrapper** y una base de datos **H2 en memoria** lista para usar.\n`)
  lines.push(`Abre tu terminal en la carpeta del proyecto y ejecuta:\n`)
  lines.push(`\`\`\`bash`)
  lines.push(`# En Linux o macOS:`)
  lines.push(`./mvnw spring-boot:run\n`)
  lines.push(`# En Windows:`)
  lines.push(`mvnw.cmd spring-boot:run`)
  lines.push(`\`\`\`\n`)
  lines.push(`¡Y listo! El servidor creará todas las tablas en memoria y arrancará en el puerto 8080 en segundos.\n`)
  lines.push(`---\n`)
  lines.push(`## 🐘 Ejecución con PostgreSQL (Opcional)\n`)
  lines.push(`Si deseas almacenar los datos de manera permanente en PostgreSQL:`)
  lines.push(`1. Levanta el contenedor PostgreSQL incluido con Docker:`)
  lines.push(`\`\`\`bash\ndocker compose up -d\n\`\`\``)
  lines.push(`2. Inicia la aplicación con el perfil de PostgreSQL:`)
  lines.push(`\`\`\`bash\n./mvnw spring-boot:run -Dspring-boot.run.profiles=postgres\n\`\`\`\n`)
  lines.push(`---\n`)
  lines.push(`## 📚 Documentación Interactiva Swagger / OpenAPI\nUna vez levantado el servidor, accede a Swagger UI para probar los endpoints:`)
  lines.push(`- **Swagger UI:** \`http://localhost:8080/swagger-ui.html\``)
  lines.push(`- **Consola H2 (en memoria):** \`http://localhost:8080/h2-console\`\n`)
  lines.push(`## 📡 Endpoints CRUD Disponibles`)
  for (const e of entidades) {
    const path = `/api/${toKebabCase(e.nombre)}`
    lines.push(`- **${toPascalCase(e.nombre)}:** \`${path}\``)
  }
  return lines.join("\n")
}
