import type {
  AtributoEntidadResponse,
  DiagramaResponse,
  EntidadDiagramaResponse,
  RelacionDiagramaResponse,
} from "@/features/diagram/types/diagram.types"
import type { ArchivoGenerado, GeneradorPreviewResponse } from "../types/generator.types"

const BASE_PACKAGE = "com.casetool.generated"
const BASE_PATH = "src/main/java/com/casetool/generated/"

// --- Helpers de nombres y tipos ---

export function toPascalCase(s?: string | null): string {
  if (!s || !s.trim()) return "Item"
  return s
    .trim()
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("") || "Item"
}

export function toCamelCase(s?: string | null): string {
  const pascal = toPascalCase(s)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toSnakeCase(s?: string | null): string {
  if (!s || !s.trim()) return "item"
  return s
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[_-\s]+/g, "_")
    .toLowerCase()
}

export function toPlural(s: string): string {
  if (!s) return "items"
  const lower = s.toLowerCase()
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z")) {
    return `${s}es`
  }
  if (/[aeiouáéíóú]$/i.test(lower)) {
    return `${s}s`
  }
  return `${s}es`
}

export function toKebabCase(s?: string | null): string {
  if (!s || !s.trim()) return "items"
  const normalized = s.trim().replace(/[_-\s]+/g, "-").toLowerCase()
  return normalized.endsWith("s") ? normalized : `${normalized}s`
}

export function sanitizarNombre(s?: string | null): string {
  if (!s || !s.trim()) return "casetool-backend"
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return cleaned || "casetool-backend"
}

export function toJavaType(sqlType?: string | null): string {
  if (!sqlType) return "String"
  const s = sqlType.toUpperCase().trim()
  if (s.includes("BIGINT") || s.includes("BIGSERIAL")) return "Long"
  if (s.includes("INT") || s.includes("SERIAL")) return "Integer"
  if (s.includes("BOOL")) return "Boolean"
  if (s.includes("DECIMAL") || s.includes("NUMERIC")) return "BigDecimal"
  if (s.includes("FLOAT") || s.includes("DOUBLE") || s.includes("REAL")) return "Double"
  if (s.includes("TIMESTAMP") || s.includes("DATETIME")) return "LocalDateTime"
  if (s.includes("DATE")) return "LocalDate"
  if (s.includes("TIME")) return "LocalTime"
  if (s.includes("CHAR") || s.includes("TEXT") || s.includes("STRING") || s.includes("VARCHAR")) return "String"
  return "String"
}

// Estructura interna para relaciones JPA
interface ManyToOneRel {
  targetEntityName: string
  fieldName: string
  columnName: string
  nullable: boolean
}

interface OneToManyRel {
  targetEntityName: string
  fieldName: string
  mappedBy: string
}

interface RelacionesPorEntidad {
  manyToOne: ManyToOneRel[]
  oneToMany: OneToManyRel[]
}

function asegurarAtributosConPk(entidad: EntidadDiagramaResponse): AtributoEntidadResponse[] {
  const lista = [...entidad.atributos]
  const tienePk = lista.some((a) => a.esPk)
  if (!tienePk) {
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
  }
  return lista
}

function obtenerTipoId(entidad: EntidadDiagramaResponse): string {
  const attrs = asegurarAtributosConPk(entidad)
  const pk = attrs.find((a) => a.esPk)
  return pk ? toJavaType(pk.tipoSql) : "Long"
}

/**
 * Resuelve las relaciones JPA (@ManyToOne y @OneToMany) a partir de:
 * 1. Atributos con FK explícita (esFk = true o referenciaEntidadId/Nombre)
 * 2. Relaciones del diagrama (multiplicidad 1:N o N:M)
 */
function resolverRelacionesJPA(
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
        if (!entidadRel.manyToOne.some((m) => m.fieldName === fieldName)) {
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
      const fieldName = toCamelCase(origen.nombre)
      const colName = `${toSnakeCase(origen.nombre)}_id`
      if (!destRel.manyToOne.some((m) => m.fieldName === fieldName)) {
        destRel.manyToOne.push({
          targetEntityName: toPascalCase(origen.nombre),
          fieldName,
          columnName: colName,
          nullable: rel.multiplicidadOrigen === "CERO_O_UNO",
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
      const fieldName = toCamelCase(destino.nombre)
      const colName = `${toSnakeCase(destino.nombre)}_id`
      if (!origRel.manyToOne.some((m) => m.fieldName === fieldName)) {
        origRel.manyToOne.push({
          targetEntityName: toPascalCase(destino.nombre),
          fieldName,
          columnName: colName,
          nullable: rel.multiplicidadDestino === "CERO_O_UNO",
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
    }
  }

  return mapa
}

// --- Generadores de Archivos de Configuración y Core ---

function generarPomXml(appName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.3</version>
        <relativePath/>
    </parent>
    <groupId>com.casetool.generated</groupId>
    <artifactId>${appName}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${appName}</name>
    <description>Backend generado automáticamente por Herramienta CASE</description>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.8.5</version>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
`
}

function generarApplicationProperties(appName: string): string {
  const dbName = appName.replace(/-/g, "_")
  return `spring.application.name=${appName}
server.port=8080

# Conexión a Base de Datos PostgreSQL
spring.datasource.url=jdbc:postgresql://localhost:5432/${dbName}_db
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver

# Hibernate DDL Auto
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Swagger OpenAPI UI
springdoc.swagger-ui.path=/swagger-ui.html
`
}

function generarReadme(projectName: string, entidades: EntidadDiagramaResponse[]): string {
  const lines: string[] = []
  lines.push(`# 🚀 ${projectName} — Backend Spring Boot\n`)
  lines.push(`Backend generado automáticamente con la **Herramienta CASE Colaborativa**.\n`)
  lines.push(`## 🛠️ Requisitos\n- Java 21 (JDK)\n- Maven 3.9+\n- PostgreSQL corriendo en \`localhost:5432\`\n`)
  lines.push(`## 📦 Cómo ejecutar\n\`\`\`bash\nmvn clean spring-boot:run\n\`\`\`\n`)
  lines.push(`## 📚 Documentación Interactiva Swagger / OpenAPI\nUna vez levantado el servidor, accede a la interfaz Swagger para probar todos los endpoints:`)
  lines.push(`- URL: \`http://localhost:8080/swagger-ui.html\`\n`)
  lines.push(`## 📡 Endpoints CRUD Disponibles`)
  for (const e of entidades) {
    const path = `/api/${toKebabCase(e.nombre)}`
    lines.push(`- **${toPascalCase(e.nombre)}:** \`${path}\``)
  }
  return lines.join("\n")
}

function generarApplicationJava(): string {
  return `package ${BASE_PACKAGE};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
`
}

function generarCorsConfigJava(): string {
  return `package ${BASE_PACKAGE}.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
`
}

function generarOpenApiConfigJava(projectName: string): string {
  return `package ${BASE_PACKAGE}.core.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("${projectName} API")
                        .version("1.0.0")
                        .description("Endpoints CRUD generados automáticamente por CASE Tool"));
    }
}
`
}

function generarGlobalExceptionHandlerJava(): string {
  return `package ${BASE_PACKAGE}.core.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", "Error de validación en los campos enviados");
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage());
        return ResponseEntity.internalServerError().body(body);
    }
}
`
}

function generarResourceNotFoundExceptionJava(): string {
  return `package ${BASE_PACKAGE}.core.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
`
}

// --- Generadores de Capas por Entidad ---

function generarModelJava(
  entidad: EntidadDiagramaResponse,
  relaciones: RelacionesPorEntidad
): string {
  const className = toPascalCase(entidad.nombre)
  const tableName = entidad.nombre.toLowerCase()
  const atributos = asegurarAtributosConPk(entidad)

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
  for (const attr of atributos) {
    const fieldName = toCamelCase(attr.nombre)
    const javaType = toJavaType(attr.tipoSql)

    if (attr.esPk) {
      lines.push(`    @Id`)
      lines.push(`    @GeneratedValue(strategy = GenerationType.IDENTITY)`)
    }
    const nullablePart = !attr.nullable ? ", nullable = false" : ""
    lines.push(`    @Column(name = "${attr.nombre.toLowerCase()}"${nullablePart})`)
    lines.push(`    private ${javaType} ${fieldName};\n`)
  }

  // Relaciones @ManyToOne
  for (const rel of relaciones.manyToOne) {
    const alreadyHasColumn = atributos.some((a) => a.nombre.toLowerCase() === rel.columnName.toLowerCase())
    lines.push(`    @ManyToOne(fetch = FetchType.LAZY)`)
    if (alreadyHasColumn) {
      // Para evitar choque con la columna escalar en Hibernate, se marca insertable=false, updatable=false
      lines.push(`    @JoinColumn(name = "${rel.columnName}", insertable = false, updatable = false)`)
    } else {
      lines.push(`    @JoinColumn(name = "${rel.columnName}")`)
    }
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
  for (const attr of atributos) {
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

function generarRepositoryJava(entidad: EntidadDiagramaResponse): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)

  return `package ${BASE_PACKAGE}.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ${BASE_PACKAGE}.model.${className};

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${idType}> {
}
`
}

function generarRequestDtoJava(entidad: EntidadDiagramaResponse): string {
  const className = toPascalCase(entidad.nombre)
  const atributos = asegurarAtributosConPk(entidad)
  const noPkAttrs = atributos.filter((a) => !a.esPk)

  const lines: string[] = []
  lines.push(`package ${BASE_PACKAGE}.dto;\n`)
  lines.push(`import jakarta.validation.constraints.*;`)
  lines.push(`import java.math.BigDecimal;`)
  lines.push(`import java.time.LocalDate;`)
  lines.push(`import java.time.LocalDateTime;`)
  lines.push(`import java.time.LocalTime;\n`)
  lines.push(`public record ${className}Request(`)

  for (let i = 0; i < noPkAttrs.length; i++) {
    const attr = noPkAttrs[i]
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

    const comma = i < noPkAttrs.length - 1 ? "," : ""
    lines.push(`    ${validation}${javaType} ${fieldName}${comma}`)
  }

  lines.push(`) {}\n`)
  return lines.join("\n")
}

function generarResponseDtoJava(entidad: EntidadDiagramaResponse): string {
  const className = toPascalCase(entidad.nombre)
  const atributos = asegurarAtributosConPk(entidad)

  const lines: string[] = []
  lines.push(`package ${BASE_PACKAGE}.dto;\n`)
  lines.push(`import java.math.BigDecimal;`)
  lines.push(`import java.time.LocalDate;`)
  lines.push(`import java.time.LocalDateTime;`)
  lines.push(`import java.time.LocalTime;`)
  lines.push(`import ${BASE_PACKAGE}.model.${className};\n`)
  lines.push(`public record ${className}Response(`)

  for (let i = 0; i < atributos.length; i++) {
    const attr = atributos[i]
    const comma = i < atributos.length - 1 ? "," : ""
    lines.push(`    ${toJavaType(attr.tipoSql)} ${toCamelCase(attr.nombre)}${comma}`)
  }

  lines.push(`) {`)
  lines.push(`    public static ${className}Response from(${className} entity) {`)
  lines.push(`        return new ${className}Response(`)

  for (let i = 0; i < atributos.length; i++) {
    const attr = atributos[i]
    const comma = i < atributos.length - 1 ? "," : ""
    lines.push(`            entity.get${toPascalCase(attr.nombre)}()${comma}`)
  }

  lines.push(`        );`)
  lines.push(`    }`)
  lines.push(`}\n`)
  return lines.join("\n")
}

function generarServiceJava(entidad: EntidadDiagramaResponse): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)
  const atributos = asegurarAtributosConPk(entidad)
  const noPkAttrs = atributos.filter((a) => !a.esPk)

  const setters = noPkAttrs
    .map(
      (a) =>
        `        entity.set${toPascalCase(a.nombre)}(request.${toCamelCase(a.nombre)}());`
    )
    .join("\n")

  return `package ${BASE_PACKAGE}.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ${BASE_PACKAGE}.core.exception.ResourceNotFoundException;
import ${BASE_PACKAGE}.dto.${className}Request;
import ${BASE_PACKAGE}.dto.${className}Response;
import ${BASE_PACKAGE}.model.${className};
import ${BASE_PACKAGE}.repository.${className}Repository;

@Service
@Transactional
public class ${className}Service {

    private final ${className}Repository repository;

    public ${className}Service(${className}Repository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<${className}Response> listarTodos() {
        return repository.findAll().stream()
                .map(${className}Response::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ${className}Response obtenerPorId(${idType} id) {
        ${className} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("${className} no encontrado con id: " + id));
        return ${className}Response.from(entity);
    }

    public ${className}Response crear(${className}Request request) {
        ${className} entity = new ${className}();
${setters}
        return ${className}Response.from(repository.save(entity));
    }

    public ${className}Response actualizar(${idType} id, ${className}Request request) {
        ${className} entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("${className} no encontrado con id: " + id));
${setters}
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

function generarControllerJava(entidad: EntidadDiagramaResponse): string {
  const className = toPascalCase(entidad.nombre)
  const idType = obtenerTipoId(entidad)
  const endpointPath = toKebabCase(entidad.nombre)

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
@RequestMapping("/api/${endpointPath}")
@CrossOrigin(origins = "*")
@Tag(name = "${className}", description = "Operaciones CRUD para ${className}")
public class ${className}Controller {

    private final ${className}Service service;

    public ${className}Controller(${className}Service service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Listar todos los registros de ${className}")
    public ResponseEntity<List<${className}Response>> listarTodos() {
        return ResponseEntity.ok(service.listarTodos());
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

// --- Motor Principal de Generación ---

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
    ruta: "src/main/resources/application.properties",
    contenido: generarApplicationProperties(appName),
    tipo: "CONFIG",
  })

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
      contenido: generarRepositoryJava(entidad),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}dto/${className}Request.java`,
      contenido: generarRequestDtoJava(entidad),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}dto/${className}Response.java`,
      contenido: generarResponseDtoJava(entidad),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}service/${className}Service.java`,
      contenido: generarServiceJava(entidad),
      tipo: "JAVA",
    })
    archivos.push({
      ruta: `${BASE_PATH}controller/${className}Controller.java`,
      contenido: generarControllerJava(entidad),
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
