# 🤖 Guía Técnica de Arquitectura Backend — CASE Tool (Spring Boot v1.0)

> **Documento para Agentes de IA y Desarrolladores.**  
> Esta guía define el estado actual, la estructura real de archivos, el contrato de endpoints REST y las reglas operativas del backend. **Especificación técnica viva del sistema v1.0.**

---

## 🎯 1. Stack Tecnológico y Arquitectura

- **Lenguaje:** Java 21 (LTS)
- **Framework:** Spring Boot 3.4.x / Spring Framework 6.x
- **Persistencia:** Spring Data JPA + Hibernate ORM (Dialecto PostgreSQL)
- **Base de Datos:** PostgreSQL 16 (contenedor `case_postgres` en puerto `5434`, base `case_db`)
- **Seguridad:** Spring Security + JWT (JJWT `0.12.6`) sin estado (`STATELESS`) y contraseñas cifradas con BCrypt
- **Procesamiento XML:** DOM Parser con protección contra inyección XXE (`disallow-doctype-decl`)
- **Documentación API:** SpringDoc OpenAPI 3.0 / Swagger UI (`/swagger-ui.html`)
- **Herramienta de Construcción:** Apache Maven con wrapper `./mvnw`

---

## 🏗️ 2. Estructura Real del Código Fuente

```text
case-backend/src/main/java/com/casetool/backend/
├── CaseBackendApplication.java               # Clase principal de arranque Spring Boot
│
├── core/                                     # 🌐 Infraestructura transversal compartida
│   ├── config/
│   │   └── CorsConfig.java                   # Configuración CORS permisiva para dev y producción
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java       # Manejador global @RestControllerAdvice (400, 401, 403, 404, 409, 500)
│   │   └── ResourceNotFoundException.java    # Excepción estándar para recursos 404
│   └── security/
│       ├── JwtAuthenticationEntryPoint.java  # Retorno 401 Unauthorized unificado en token ausente o inválido
│       ├── JwtAuthenticationFilter.java      # Filtro OncePerRequest con validación criptográfica de firma
│       ├── JwtService.java                   # Extracción de claims, generación y validación de tokens HMAC
│       └── SecurityConfig.java               # Configuración de SecurityFilterChain, filtros y BCryptPasswordEncoder
│
└── modules/                                  # 🚀 Módulos de Negocio (Monolito Modular)
    ├── seguridad/                            # 🔑 Autenticación y Cuentas de Usuario
    │   ├── controller/   AuthController.java (/api/v1/auth/register, /login, /me)
    │   ├── dto/          AuthResponse, LoginRequest, RegisterRequest, UsuarioResponse
    │   ├── exception/    CredencialesInvalidasException (401), RecursoDuplicadoException (409)
    │   ├── model/        Usuario, UsuarioPrincipal (implementa UserDetails, expone getId())
    │   ├── repository/   UsuarioRepository (búsqueda por username, email)
    │   └── service/      AuthService, UsuarioDetailsService
    │
    ├── proyecto/                             # 📁 Proyectos, Miembros, Tareas, Notas y Colaboración
    │   ├── controller/   ProyectoController, MiembroProyectoController, TareaProyectoController,
    │   │                 NotaProyectoController, ColaboracionController
    │   ├── dto/          ProyectoRequest/Response, MiembroProyectoRequest/Response,
    │   │                 TareaProyectoRequest/Response, CambiarEstadoTareaRequest,
    │   │                 NotaProyectoRequest/Response, CambiarRolMiembroRequest
    │   ├── exception/    AccesoDenegadoProyectoException (403), RolInsuficienteProyectoException (403),
    │   │                 MiembroYaExisteException (409)
    │   ├── model/        Proyecto, MiembroProyecto (ADMIN, COLABORADOR, LECTOR), TareaProyecto, NotaProyecto
    │   ├── repository/   ProyectoRepository, MiembroProyectoRepository (@EntityGraph),
    │   │                 TareaProyectoRepository, NotaProyectoRepository
    │   └── service/      ProyectoService, MiembroProyectoService, TareaProyectoService,
    │                     NotaProyectoService, ProyectoAccesoService (validación jerárquica de roles)
    │
    ├── diagrama/                             # 📐 Lienzo UML (Tablas, Atributos, Relaciones)
    │   ├── controller/   DiagramaController, EntidadDiagramaController, AtributoEntidadController,
    │   │                 RelacionDiagramaController
    │   ├── dto/          DiagramaResponse, EntidadDiagramaRequest/Response, AtributoEntidadRequest/Response,
    │   │                 RelacionDiagramaRequest/Response, ActualizarPuntosControlRequest, PuntoControlDto
    │   ├── exception/    NombreDuplicadoDiagramaException (409)
    │   ├── model/        EntidadDiagrama, AtributoEntidad, RelacionDiagrama, PuntoControl
    │   ├── repository/   EntidadDiagramaRepository, AtributoEntidadRepository, RelacionDiagramaRepository
    │   └── service/      DiagramaService (carga optimizada O(1)), EntidadDiagramaService,
    │                     AtributoEntidadService, RelacionDiagramaService
    │
    └── xmi/                                  # 🔄 Interoperabilidad con Enterprise Architect
        ├── controller/   XmiController (/api/proyectos/{id}/xmi/exportar, /importar)
        └── service/      XmiExportService (emite XMI 1.1 con AssociationClass),
                          XmiImportService (parser dual para dialectos EA y XMI 2.1)
```

---

## 📡 3. Contrato de API REST (Endpoints v1.0)

Todos los endpoints requieren el encabezado `Authorization: Bearer <token>` salvo `/auth/register` y `/auth/login`.

| Módulo | Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Público | Registro de nueva cuenta de usuario |
| **Auth** | `POST` | `/api/v1/auth/login` | Público | Login de usuario; retorna JWT token |
| **Auth** | `GET` | `/api/v1/auth/me` | Autenticado | Perfil y datos del usuario en sesión actual |
| **Proyectos** | `GET` | `/api/v1/proyectos` | Autenticado | Listado de proyectos en los que participa el usuario |
| **Proyectos** | `POST` | `/api/v1/proyectos` | Autenticado | Crea proyecto (el creador se asigna como `ADMIN`) |
| **Proyectos** | `GET` | `/api/v1/proyectos/{id}` | LECTOR | Detalle de un proyecto específico |
| **Proyectos** | `PUT` | `/api/v1/proyectos/{id}` | ADMIN | Edita nombre o descripción del proyecto |
| **Proyectos** | `DELETE`| `/api/v1/proyectos/{id}` | ADMIN | Elimina proyecto completo (cascada en BD) |
| **Miembros** | `GET` | `/api/v1/proyectos/{id}/miembros` | LECTOR | Lista los colaboradores y sus roles asignados |
| **Miembros** | `POST` | `/api/v1/proyectos/{id}/miembros` | ADMIN | Agrega colaborador por username o email |
| **Miembros** | `PUT` | `/api/v1/proyectos/{id}/miembros/{usuarioId}/rol` | ADMIN | Modifica rol (`ADMIN`, `COLABORADOR`, `LECTOR`) |
| **Miembros** | `DELETE`| `/api/v1/proyectos/{id}/miembros/{usuarioId}` | ADMIN | Desvincula colaborador (protege al último admin) |
| **Tareas** | `GET` | `/api/v1/proyectos/{id}/tareas` | LECTOR | Lista tareas del tablero Kanban |
| **Tareas** | `POST` | `/api/v1/proyectos/{id}/tareas` | COLABORADOR | Crea tarea (`PENDIENTE`, `EN_PROCESO`, `COMPLETADA`) |
| **Tareas** | `PATCH`| `/api/v1/proyectos/{id}/tareas/{id}/estado` | COLABORADOR | Transición rápida de estado en el Kanban |
| **Tareas** | `DELETE`| `/api/v1/proyectos/{id}/tareas/{id}` | COLABORADOR | Elimina tarea del tablero |
| **Notas** | `GET` | `/api/v1/proyectos/{id}/notas` | LECTOR | Timeline de decisiones arquitectónicas (ADRs) |
| **Notas** | `POST` | `/api/v1/proyectos/{id}/notas` | COLABORADOR | Registra nota de diseño inmutable con motivo |
| **Diagrama** | `GET` | `/api/v1/proyectos/{id}/diagrama` | LECTOR | Retorna entidades, atributos y relaciones juntas |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/entidades` | COLABORADOR | Crea tabla en el lienzo |
| **Diagrama** | `PUT` | `/api/v1/proyectos/{id}/entidades/{id}` | COLABORADOR | Modifica nombre y coordenadas `pos_x`/`pos_y` |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/entidades/{id}` | COLABORADOR | Elimina tabla (si no está referenciada por FK) |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/entidades/{id}/atributos` | COLABORADOR | Añade atributo (PK, FK, tipo SQL, nullable) |
| **Diagrama** | `PUT` | `/api/v1/proyectos/{id}/entidades/{id}/atributos/{atId}` | COLABORADOR | Actualiza definición de atributo |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/entidades/{id}/atributos/{atId}` | COLABORADOR | Elimina atributo de una tabla |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/relaciones` | COLABORADOR | Crea relación con multiplicidad en ambos extremos |
| **Diagrama** | `PATCH`| `/api/v1/proyectos/{id}/relaciones/{id}/puntos` | COLABORADOR | Guarda puntos de quiebre de la polilínea |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/relaciones/{id}` | COLABORADOR | Elimina relación |
| **Colaboración**| `POST`| `/api/proyectos/{id}/colaboracion/presencia` | Autenticado | Heartbeat y presencia de colaboradores en tiempo real |
| **XMI** | `GET` | `/api/proyectos/{id}/xmi/exportar` | LECTOR | Descarga XML en formato XMI 1.1 Enterprise Architect |
| **XMI** | `POST` | `/api/proyectos/{id}/xmi/importar` | COLABORADOR | Sube archivo XMI para auto-generar el diagrama |

---

## 📐 4. Convenciones Mandatorias de Arquitectura

1. **Monolito Modular y Subpaquetes Canónicos:** Cada módulo nuevo debe implementar obligatoriamente: `controller`, `dto`, `exception`, `model`, `repository`, `service`.
2. **Autorización Centralizada:** La verificación de membresía y rol jerárquico (`ADMIN > COLABORADOR > LECTOR`) se realiza mediante `ProyectoAccesoService.validarAcceso(proyectoId, usuarioId, rolRequerido)`.
3. **Prevención de N+1:** Prohibido ejecutar consultas JPA individuales en bucles. Usar `@EntityGraph(attributePaths = {...})` o agregación en memoria con `Collectors.groupingBy`.
4. **Reglas Operativas:**
   - No alterar esquemas ni entidades de base de datos sin instrucción explícita.
   - Todo cambio debe compilar con `./mvnw test` o `mvn clean compile`.
   - NUNCA ejecutar `git push`.
