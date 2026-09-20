package com.casetool.backend.modules.generator.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.generator.dto.ArchivoGeneradoDto;
import com.casetool.backend.modules.generator.dto.GeneradorPreviewResponse;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional(readOnly = true)
public class GeneradorService {

    private static final String BASE_PACKAGE = "com.casetool.generated";
    private static final String BASE_PATH = "src/main/java/com/casetool/generated/";

    private final ProyectoRepository proyectoRepository;
    private final DiagramaService diagramaService;
    private final ProyectoAccesoService accesoService;

    public GeneradorService(
            ProyectoRepository proyectoRepository,
            DiagramaService diagramaService,
            ProyectoAccesoService accesoService) {
        this.proyectoRepository = proyectoRepository;
        this.diagramaService = diagramaService;
        this.accesoService = accesoService;
    }

    public GeneradorPreviewResponse obtenerPreview(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));

        DiagramaResponse diagrama = diagramaService.obtenerDiagrama(proyectoId, usuarioId);
        List<ArchivoGeneradoDto> archivos = generarArchivos(proyecto, diagrama);
        List<String> nombresEntidades = diagrama.entidades().stream()
                .map(e -> toPascalCase(e.nombre()))
                .toList();

        return new GeneradorPreviewResponse(
                proyecto.getNombre(),
                archivos.size(),
                nombresEntidades,
                archivos
        );
    }

    public byte[] generarZip(Long proyectoId, Long usuarioId) {
        GeneradorPreviewResponse preview = obtenerPreview(proyectoId, usuarioId);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            for (ArchivoGeneradoDto archivo : preview.archivos()) {
                ZipEntry entry = new ZipEntry(archivo.ruta());
                zos.putNextEntry(entry);
                zos.write(archivo.contenido().getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }
            zos.finish();
            return baos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error al empaquetar el código generado en ZIP", e);
        }
    }

    private List<ArchivoGeneradoDto> generarArchivos(Proyecto proyecto, DiagramaResponse diagrama) {
        List<ArchivoGeneradoDto> archivos = new ArrayList<>();
        String appName = sanitizarNombre(proyecto.getNombre());

        archivos.add(new ArchivoGeneradoDto("pom.xml", generarPomXml(appName), "CONFIG"));
        archivos.add(new ArchivoGeneradoDto("README.md", generarReadme(proyecto.getNombre(), diagrama.entidades()), "DOC"));
        archivos.add(new ArchivoGeneradoDto("src/main/resources/application.properties", generarApplicationProperties(appName), "CONFIG"));

        archivos.add(new ArchivoGeneradoDto(BASE_PATH + "Application.java", generarApplicationJava(), "JAVA"));
        archivos.add(new ArchivoGeneradoDto(BASE_PATH + "core/config/CorsConfig.java", generarCorsConfigJava(), "JAVA"));
        archivos.add(new ArchivoGeneradoDto(BASE_PATH + "core/config/OpenApiConfig.java", generarOpenApiConfigJava(proyecto.getNombre()), "JAVA"));
        archivos.add(new ArchivoGeneradoDto(BASE_PATH + "core/exception/GlobalExceptionHandler.java", generarGlobalExceptionHandlerJava(), "JAVA"));
        archivos.add(new ArchivoGeneradoDto(BASE_PATH + "core/exception/ResourceNotFoundException.java", generarResourceNotFoundExceptionJava(), "JAVA"));

        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            String className = toPascalCase(entidad.nombre());
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "model/" + className + ".java", generarModelJava(entidad), "JAVA"));
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "repository/" + className + "Repository.java", generarRepositoryJava(entidad), "JAVA"));
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "dto/" + className + "Request.java", generarRequestDtoJava(entidad), "JAVA"));
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "dto/" + className + "Response.java", generarResponseDtoJava(entidad), "JAVA"));
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "service/" + className + "Service.java", generarServiceJava(entidad), "JAVA"));
            archivos.add(new ArchivoGeneradoDto(BASE_PATH + "controller/" + className + "Controller.java", generarControllerJava(entidad), "JAVA"));
        }

        return archivos;
    }

    private String generarPomXml(String appName) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
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
                <artifactId>%s</artifactId>
                <version>0.0.1-SNAPSHOT</version>
                <name>%s</name>
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
                        </plugin>
                    </plugins>
                </build>
            </project>
            """.formatted(appName, appName);
    }

    private String generarApplicationProperties(String appName) {
        return """
            spring.application.name=%s
            server.port=8080

            # Conexión a Base de Datos PostgreSQL
            spring.datasource.url=jdbc:postgresql://localhost:5432/%s_db
            spring.datasource.username=postgres
            spring.datasource.password=postgres
            spring.datasource.driver-class-name=org.postgresql.Driver

            # Hibernate DDL Auto
            spring.jpa.hibernate.ddl-auto=update
            spring.jpa.show-sql=true
            spring.jpa.properties.hibernate.format_sql=true

            # Swagger OpenAPI UI
            springdoc.swagger-ui.path=/swagger-ui.html
            """.formatted(appName, appName.replace("-", "_"));
    }

    private String generarReadme(String projectName, List<EntidadDiagramaResponse> entidades) {
        StringBuilder sb = new StringBuilder();
        sb.append("# 🚀 ").append(projectName).append(" — Backend Spring Boot\n\n");
        sb.append("Backend generado automáticamente con la **Herramienta CASE Colaborativa**.\n\n");
        sb.append("## 🛠️ Requisitos\n");
        sb.append("- Java 21 (JDK)\n");
        sb.append("- Maven 3.9+\n");
        sb.append("- PostgreSQL corriendo en `localhost:5432`\n\n");
        sb.append("## 📦 Cómo ejecutar\n");
        sb.append("```bash\n");
        sb.append("mvn clean spring-boot:run\n");
        sb.append("```\n\n");
        sb.append("## 📚 Documentación Interactiva Swagger / OpenAPI\n");
        sb.append("Una vez levantado el servidor, accede a la interfaz Swagger para probar todos los endpoints:\n");
        sb.append("- URL: `http://localhost:8080/swagger-ui.html`\n\n");
        sb.append("## 📡 Endpoints CRUD Disponibles\n");
        for (EntidadDiagramaResponse e : entidades) {
            String path = "/api/" + toKebabCase(e.nombre());
            sb.append("- **").append(toPascalCase(e.nombre())).append(":** `").append(path).append("`\n");
        }
        return sb.toString();
    }

    private String generarApplicationJava() {
        return """
            package %s;

            import org.springframework.boot.SpringApplication;
            import org.springframework.boot.autoconfigure.SpringBootApplication;

            @SpringBootApplication
            public class Application {
                public static void main(String[] args) {
                    SpringApplication.run(Application.class, args);
                }
            }
            """.formatted(BASE_PACKAGE);
    }

    private String generarCorsConfigJava() {
        return """
            package %s.core.config;

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
            """.formatted(BASE_PACKAGE);
    }

    private String generarOpenApiConfigJava(String projectName) {
        return """
            package %s.core.config;

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
                                    .title("%s API")
                                    .version("1.0.0")
                                    .description("Endpoints CRUD generados automáticamente por CASE Tool"));
                }
            }
            """.formatted(BASE_PACKAGE, projectName);
    }

    private String generarGlobalExceptionHandlerJava() {
        return """
            package %s.core.exception;

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
            """.formatted(BASE_PACKAGE);
    }

    private String generarResourceNotFoundExceptionJava() {
        return """
            package %s.core.exception;

            public class ResourceNotFoundException extends RuntimeException {
                public ResourceNotFoundException(String message) {
                    super(message);
                }
            }
            """.formatted(BASE_PACKAGE);
    }

    private String generarModelJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        String tableName = entidad.nombre().toLowerCase();
        StringBuilder sb = new StringBuilder();

        sb.append("package ").append(BASE_PACKAGE).append(".model;\n\n");
        sb.append("import jakarta.persistence.*;\n");
        sb.append("import java.math.BigDecimal;\n");
        sb.append("import java.time.LocalDate;\n");
        sb.append("import java.time.LocalDateTime;\n\n");
        sb.append("@Entity\n");
        sb.append("@Table(name = \"").append(tableName).append("\")\n");
        sb.append("public class ").append(className).append(" {\n\n");

        List<AtributoEntidadResponse> atributos = asegurarAtributosConPk(entidad);

        for (AtributoEntidadResponse attr : atributos) {
            String fieldName = toCamelCase(attr.nombre());
            String javaType = toJavaType(attr.tipoSql());

            if (attr.esPk()) {
                sb.append("    @Id\n");
                sb.append("    @GeneratedValue(strategy = GenerationType.IDENTITY)\n");
            }
            sb.append("    @Column(name = \"").append(attr.nombre().toLowerCase()).append("\"");
            if (!attr.nullable()) {
                sb.append(", nullable = false");
            }
            sb.append(")\n");
            sb.append("    private ").append(javaType).append(" ").append(fieldName).append(";\n\n");
        }

        // Constructor vacío requerido por JPA
        sb.append("    public ").append(className).append("() {}\n\n");

        // Getters y Setters
        for (AtributoEntidadResponse attr : atributos) {
            String fieldName = toCamelCase(attr.nombre());
            String methodName = toPascalCase(attr.nombre());
            String javaType = toJavaType(attr.tipoSql());

            sb.append("    public ").append(javaType).append(" get").append(methodName).append("() {\n");
            sb.append("        return this.").append(fieldName).append(";\n");
            sb.append("    }\n\n");

            sb.append("    public void set").append(methodName).append("(").append(javaType).append(" ").append(fieldName).append(") {\n");
            sb.append("        this.").append(fieldName).append(" = ").append(fieldName).append(";\n");
            sb.append("    }\n\n");
        }

        sb.append("}\n");
        return sb.toString();
    }

    private String generarRepositoryJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        String idType = obtenerTipoId(entidad);

        return """
            package %s.repository;

            import org.springframework.data.jpa.repository.JpaRepository;
            import org.springframework.stereotype.Repository;
            import %s.model.%s;

            @Repository
            public interface %sRepository extends JpaRepository<%s, %s> {
            }
            """.formatted(BASE_PACKAGE, BASE_PACKAGE, className, className, className, idType);
    }

    private String generarRequestDtoJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        List<AtributoEntidadResponse> noPkAttrs = asegurarAtributosConPk(entidad).stream()
                .filter(a -> !a.esPk())
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("package ").append(BASE_PACKAGE).append(".dto;\n\n");
        sb.append("import jakarta.validation.constraints.*;\n");
        sb.append("import java.math.BigDecimal;\n");
        sb.append("import java.time.LocalDate;\n");
        sb.append("import java.time.LocalDateTime;\n\n");

        sb.append("public record ").append(className).append("Request(\n");
        for (int i = 0; i < noPkAttrs.size(); i++) {
            AtributoEntidadResponse attr = noPkAttrs.get(i);
            String fieldName = toCamelCase(attr.nombre());
            String javaType = toJavaType(attr.tipoSql());

            sb.append("    ");
            if (!attr.nullable()) {
                if ("String".equals(javaType)) {
                    sb.append("@NotBlank(message = \"").append(fieldName).append(" no puede estar vacío\") ");
                } else {
                    sb.append("@NotNull(message = \"").append(fieldName).append(" es obligatorio\") ");
                }
            }
            sb.append(javaType).append(" ").append(fieldName);
            if (i < noPkAttrs.size() - 1) {
                sb.append(",\n");
            }
        }
        sb.append("\n) {}\n");
        return sb.toString();
    }

    private String generarResponseDtoJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        List<AtributoEntidadResponse> attrs = asegurarAtributosConPk(entidad);

        StringBuilder sb = new StringBuilder();
        sb.append("package ").append(BASE_PACKAGE).append(".dto;\n\n");
        sb.append("import java.math.BigDecimal;\n");
        sb.append("import java.time.LocalDate;\n");
        sb.append("import java.time.LocalDateTime;\n");
        sb.append("import ").append(BASE_PACKAGE).append(".model.").append(className).append(";\n\n");

        sb.append("public record ").append(className).append("Response(\n");
        for (int i = 0; i < attrs.size(); i++) {
            AtributoEntidadResponse attr = attrs.get(i);
            sb.append("    ").append(toJavaType(attr.tipoSql())).append(" ").append(toCamelCase(attr.nombre()));
            if (i < attrs.size() - 1) {
                sb.append(",\n");
            }
        }
        sb.append("\n) {\n");

        // Factory method from(Entity entity)
        sb.append("    public static ").append(className).append("Response from(").append(className).append(" entity) {\n");
        sb.append("        return new ").append(className).append("Response(\n");
        for (int i = 0; i < attrs.size(); i++) {
            AtributoEntidadResponse attr = attrs.get(i);
            sb.append("            entity.get").append(toPascalCase(attr.nombre())).append("()");
            if (i < attrs.size() - 1) {
                sb.append(",\n");
            }
        }
        sb.append("\n        );\n");
        sb.append("    }\n");
        sb.append("}\n");
        return sb.toString();
    }

    private String generarServiceJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        String idType = obtenerTipoId(entidad);
        String idFieldName = obtenerNombreId(entidad);
        List<AtributoEntidadResponse> noPkAttrs = asegurarAtributosConPk(entidad).stream()
                .filter(a -> !a.esPk())
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("package ").append(BASE_PACKAGE).append(".service;\n\n");
        sb.append("import java.util.List;\n");
        sb.append("import org.springframework.stereotype.Service;\n");
        sb.append("import org.springframework.transaction.annotation.Transactional;\n");
        sb.append("import ").append(BASE_PACKAGE).append(".core.exception.ResourceNotFoundException;\n");
        sb.append("import ").append(BASE_PACKAGE).append(".dto.").append(className).append("Request;\n");
        sb.append("import ").append(BASE_PACKAGE).append(".dto.").append(className).append("Response;\n");
        sb.append("import ").append(BASE_PACKAGE).append(".model.").append(className).append(";\n");
        sb.append("import ").append(BASE_PACKAGE).append(".repository.").append(className).append("Repository;\n\n");

        sb.append("@Service\n");
        sb.append("@Transactional\n");
        sb.append("public class ").append(className).append("Service {\n\n");
        sb.append("    private final ").append(className).append("Repository repository;\n\n");
        sb.append("    public ").append(className).append("Service(").append(className).append("Repository repository) {\n");
        sb.append("        this.repository = repository;\n");
        sb.append("    }\n\n");

        sb.append("    @Transactional(readOnly = true)\n");
        sb.append("    public List<").append(className).append("Response> listarTodos() {\n");
        sb.append("        return repository.findAll().stream()\n");
        sb.append("                .map(").append(className).append("Response::from)\n");
        sb.append("                .toList();\n");
        sb.append("    }\n\n");

        sb.append("    @Transactional(readOnly = true)\n");
        sb.append("    public ").append(className).append("Response obtenerPorId(").append(idType).append(" id) {\n");
        sb.append("        ").append(className).append(" entity = repository.findById(id)\n");
        sb.append("                .orElseThrow(() -> new ResourceNotFoundException(\"").append(className).append(" no encontrado con id: \" + id));\n");
        sb.append("        return ").append(className).append("Response.from(entity);\n");
        sb.append("    }\n\n");

        sb.append("    public ").append(className).append("Response crear(").append(className).append("Request request) {\n");
        sb.append("        ").append(className).append(" entity = new ").append(className).append("();\n");
        for (AtributoEntidadResponse a : noPkAttrs) {
            sb.append("        entity.set").append(toPascalCase(a.nombre())).append("(request.").append(toCamelCase(a.nombre())).append("());\n");
        }
        sb.append("        return ").append(className).append("Response.from(repository.save(entity));\n");
        sb.append("    }\n\n");

        sb.append("    public ").append(className).append("Response actualizar(").append(idType).append(" id, ").append(className).append("Request request) {\n");
        sb.append("        ").append(className).append(" entity = repository.findById(id)\n");
        sb.append("                .orElseThrow(() -> new ResourceNotFoundException(\"").append(className).append(" no encontrado con id: \" + id));\n");
        for (AtributoEntidadResponse a : noPkAttrs) {
            sb.append("        entity.set").append(toPascalCase(a.nombre())).append("(request.").append(toCamelCase(a.nombre())).append("());\n");
        }
        sb.append("        return ").append(className).append("Response.from(repository.save(entity));\n");
        sb.append("    }\n\n");

        sb.append("    public void eliminar(").append(idType).append(" id) {\n");
        sb.append("        if (!repository.existsById(id)) {\n");
        sb.append("            throw new ResourceNotFoundException(\"").append(className).append(" no encontrado con id: \" + id);\n");
        sb.append("        }\n");
        sb.append("        repository.deleteById(id);\n");
        sb.append("    }\n");
        sb.append("}\n");

        return sb.toString();
    }

    private String generarControllerJava(EntidadDiagramaResponse entidad) {
        String className = toPascalCase(entidad.nombre());
        String idType = obtenerTipoId(entidad);
        String endpointPath = "/api/" + toKebabCase(entidad.nombre());

        return """
            package ${BASE_PACKAGE}.controller;

            import java.util.List;
            import org.springframework.http.HttpStatus;
            import org.springframework.http.ResponseEntity;
            import org.springframework.web.bind.annotation.*;
            import io.swagger.v3.oas.annotations.Operation;
            import io.swagger.v3.oas.annotations.tags.Tag;
            import jakarta.validation.Valid;
            import ${BASE_PACKAGE}.dto.${CLASS_NAME}Request;
            import ${BASE_PACKAGE}.dto.${CLASS_NAME}Response;
            import ${BASE_PACKAGE}.service.${CLASS_NAME}Service;

            @RestController
            @RequestMapping("${ENDPOINT_PATH}")
            @CrossOrigin(origins = "*")
            @Tag(name = "${CLASS_NAME}", description = "Operaciones CRUD para ${CLASS_NAME}")
            public class ${CLASS_NAME}Controller {

                private final ${CLASS_NAME}Service service;

                public ${CLASS_NAME}Controller(${CLASS_NAME}Service service) {
                    this.service = service;
                }

                @GetMapping
                @Operation(summary = "Listar todos los registros de ${CLASS_NAME}")
                public ResponseEntity<List<${CLASS_NAME}Response>> listarTodos() {
                    return ResponseEntity.ok(service.listarTodos());
                }

                @GetMapping("/{id}")
                @Operation(summary = "Obtener ${CLASS_NAME} por identificador")
                public ResponseEntity<${CLASS_NAME}Response> obtenerPorId(@PathVariable ${ID_TYPE} id) {
                    return ResponseEntity.ok(service.obtenerPorId(id));
                }

                @PostMapping
                @Operation(summary = "Crear nuevo registro de ${CLASS_NAME}")
                public ResponseEntity<${CLASS_NAME}Response> crear(@Valid @RequestBody ${CLASS_NAME}Request request) {
                    return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
                }

                @PutMapping("/{id}")
                @Operation(summary = "Actualizar registro existente de ${CLASS_NAME}")
                public ResponseEntity<${CLASS_NAME}Response> actualizar(@PathVariable ${ID_TYPE} id, @Valid @RequestBody ${CLASS_NAME}Request request) {
                    return ResponseEntity.ok(service.actualizar(id, request));
                }

                @DeleteMapping("/{id}")
                @Operation(summary = "Eliminar registro de ${CLASS_NAME}")
                public ResponseEntity<Void> eliminar(@PathVariable ${ID_TYPE} id) {
                    service.eliminar(id);
                    return ResponseEntity.noContent().build();
                }
            }
            """
            .replace("${BASE_PACKAGE}", BASE_PACKAGE)
            .replace("${CLASS_NAME}", className)
            .replace("${ID_TYPE}", idType)
            .replace("${ENDPOINT_PATH}", endpointPath);
    }

    private List<AtributoEntidadResponse> asegurarAtributosConPk(EntidadDiagramaResponse entidad) {
        List<AtributoEntidadResponse> lista = new ArrayList<>(entidad.atributos());
        boolean tienePk = lista.stream().anyMatch(AtributoEntidadResponse::esPk);
        if (!tienePk) {
            // Si la tabla no tiene PK explícita en el diagrama, inyectamos una PK canónica id SERIAL
            lista.add(0, new AtributoEntidadResponse(0L, entidad.id(), "id", "SERIAL", true, false, null, null, false));
        }
        return lista;
    }

    private String obtenerTipoId(EntidadDiagramaResponse entidad) {
        return asegurarAtributosConPk(entidad).stream()
                .filter(AtributoEntidadResponse::esPk)
                .findFirst()
                .map(a -> toJavaType(a.tipoSql()))
                .orElse("Long");
    }

    private String obtenerNombreId(EntidadDiagramaResponse entidad) {
        return asegurarAtributosConPk(entidad).stream()
                .filter(AtributoEntidadResponse::esPk)
                .findFirst()
                .map(AtributoEntidadResponse::nombre)
                .orElse("id");
    }

    private String toJavaType(String sqlType) {
        if (sqlType == null) return "String";
        String s = sqlType.toUpperCase().trim();
        if (s.contains("INT") || s.contains("SERIAL")) {
            if (s.contains("BIG")) return "Long";
            return "Integer";
        }
        if (s.contains("CHAR") || s.contains("TEXT") || s.contains("STRING")) return "String";
        if (s.contains("BOOL")) return "Boolean";
        if (s.contains("DECIMAL") || s.contains("NUMERIC")) return "BigDecimal";
        if (s.contains("FLOAT") || s.contains("DOUBLE") || s.contains("REAL")) return "Double";
        if (s.contains("DATE")) return "LocalDate";
        if (s.contains("TIME")) return "LocalDateTime";
        return "String";
    }

    private String toPascalCase(String s) {
        if (s == null || s.isBlank()) return "Item";
        StringBuilder sb = new StringBuilder();
        for (String part : s.split("[_\\-\\s]+")) {
            if (!part.isBlank()) {
                sb.append(Character.toUpperCase(part.charAt(0)));
                if (part.length() > 1) {
                    sb.append(part.substring(1).toLowerCase());
                }
            }
        }
        return sb.length() > 0 ? sb.toString() : "Item";
    }

    private String toCamelCase(String s) {
        String pascal = toPascalCase(s);
        return Character.toLowerCase(pascal.charAt(0)) + (pascal.length() > 1 ? pascal.substring(1) : "");
    }

    private String toKebabCase(String s) {
        if (s == null || s.isBlank()) return "items";
        String normalized = s.replaceAll("[_\\s]+", "-").toLowerCase();
        return normalized.endsWith("s") ? normalized : normalized + "s";
    }

    private String sanitizarNombre(String s) {
        if (s == null || s.isBlank()) return "casetool-backend";
        return s.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
