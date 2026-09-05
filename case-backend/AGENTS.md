# CASE Backend — Arquitectura y Árbol Proyectado

Fuente de verdad técnica exclusiva de `case-backend`. El `AGENTS.md` de la raíz del repo
solo enlaza para acá; el resumen de avance/decisiones para seguimiento del parcial vive en
el vault (`SW/Parcial1/backend/Backend.md`).

## Stack

Spring Boot, Java 21, PostgreSQL, JPA/Hibernate, Lombok, Spring Security + JWT (jjwt 0.12.6).

## Paquete base: `com.casetool.backend`

- `core/exception`: manejo global de errores (`ResourceNotFoundException`, `CredencialesInvalidasException`, `RecursoDuplicadoException`, `GlobalExceptionHandler`).
- `core/web`: configuración CORS.
- `core/security`: `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` — auth JWT stateless, `permitAll` solo en `/api/auth/login` y `/api/auth/register`, todo lo demás requiere `Authorization: Bearer <token>`.
- `modules/project`: CRUD de proyectos (`Project`, `ProjectRepository/Service/Controller`).
- `modules/diagram`: modelo de diagrama UML — `DiagramEntity` (tabla/clase) con
  `EntityAttribute` embebido (nombre, tipo, PK/FK/nullable) y `DiagramRelation`
  (`ONE_TO_ONE`, `ONE_TO_MANY`, `MANY_TO_ONE`, `MANY_TO_MANY`).
- `modules/usuario`: `Usuario`, `UsuarioRepository`, `UsuarioDetailsService`, `AuthService`, `AuthController` — login/register con JWT, sin roles ni bloqueo por intentos (simplificado a propósito, ver Backend.md del vault).

## Dev local (sin Docker)

Cluster PostgreSQL nativo en el puerto `5433` (rol `lmc`, base `case_db`, password
`case_password123` — ver `application.properties`). Levantar con `./mvnw spring-boot:run`
(puerto `8081`).

## Docker (agregado 2026-09-05)

`Dockerfile` multi-stage (Maven build → `eclipse-temurin:21-jre`). Se levanta junto a Postgres y
al frontend vía `../docker-compose.yml` (raíz de `sw-case/`) — variables reales en `../.env`
(gitignoreado, ver `../.env.example`). Dentro del compose usa el Postgres del propio compose
(puerto `5434` en el host), no el cluster nativo. Verificado end-to-end: `docker compose up -d`
→ registro real vía `POST /api/auth/register` → JWT emitido → persistido en Postgres.

**Usuario de prueba (bootstrap manual, no seed):** `demo` / `secreta123` — vive en el volumen
`case_pgdata`, se pierde si se resetea.

## Endpoints principales

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (público solo login/register)
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}` — requieren JWT
- `GET /api/projects/{id}/diagram` — carga el diagrama completo (entidades + relaciones)
- `POST /api/projects/{id}/entities`, `PUT/DELETE /api/entities/{id}`
- `POST /api/projects/{id}/relations`, `PUT/DELETE /api/relations/{id}`

## Pendiente

- **Grupo** (próximo paso acordado): equipos compartidos (`modules/grupo`) — un grupo de
  personas crea su grupo y todos sus miembros ven los mismos proyectos/diagramas (`Project`
  pasa a depender de `Grupo`, no de un usuario individual). Detalle completo de decisiones
  en `SW/Parcial1/backend/Backend.md` del vault. Orden: ~~usuario~~ (hecho) → `grupo` →
  migrar `project`.
- Fase 3: exportar/importar XMI hacia Enterprise Architect.
- Fase 4: generador de backend Spring Boot a partir del modelo.
- Fase 5.2: foto → modelo (endpoint de visión).
- Fase 6: colaboración en tiempo real (WebSocket/STOMP).

## Árbol proyectado (todas las fases del Plan de Trabajo)

Solo documentación de planificación — nada de esto existe todavía salvo lo marcado ✅.
No crear estas carpetas/archivos hasta que se confirme cada fase explícitamente.

```text
case-backend/
├── Dockerfile                                          ✅
├── pom.xml                                             ✅ web, data-jpa, postgresql, validation, lombok, devtools,
│                                                           security, jjwt-api/impl/jackson 0.12.6
│                                                        ⏳ + spring-boot-starter-websocket (Fase 6)
└── src/main/
    ├── resources/
    │   ├── application.properties                      ✅ incl. jwt.secret, jwt.expiration-ms
    │   └── templates/spring-boot/                       ⏳ Fase 4 — plantillas del generador de código
    │       ├── Entity.java.tpl
    │       ├── Repository.java.tpl
    │       ├── Dto.java.tpl
    │       ├── Service.java.tpl
    │       ├── Controller.java.tpl
    │       ├── pom.xml.tpl
    │       └── application.properties.tpl
    └── java/com/casetool/backend/
        ├── CaseBackendApplication.java                 ✅
        │
        ├── core/                                       # infraestructura transversal, sin lógica de negocio
        │   ├── exception/                               ✅
        │   │   ├── ResourceNotFoundException.java
        │   │   ├── CredencialesInvalidasException.java
        │   │   ├── RecursoDuplicadoException.java
        │   │   └── GlobalExceptionHandler.java
        │   ├── web/                                     ✅
        │   │   └── CorsConfig.java
        │   ├── security/                                ✅ login
        │   │   ├── JwtService.java                        # generar/validar JWT
        │   │   ├── JwtAuthenticationFilter.java            # lee header Authorization, puebla SecurityContext
        │   │   └── SecurityConfig.java                     # BCrypt, sesión STATELESS, reglas permitAll/authenticated
        │   └── websocket/                                ⏳ Fase 6
        │       └── WebSocketConfig.java                   # broker STOMP, endpoint /ws-case
        │
        └── modules/                                     # package-by-feature — una carpeta por feature de negocio
            │
            ├── project/                                  ✅ (🔜 se le agrega FK grupo)
            │   ├── Project.java                            # + campo `grupo` (@ManyToOne Grupo) [🔜]
            │   ├── ProjectRepository.java                  # + findByGrupoId(Long grupoId) [🔜]
            │   ├── ProjectService.java                     # + validarAccesoDeGrupo(usuario, grupoId) [🔜]
            │   ├── ProjectController.java                  # rutas migran a /api/groups/{groupId}/projects [🔜]
            │   └── dto/
            │       ├── ProjectRequest.java
            │       └── ProjectResponse.java
            │
            ├── diagram/                                  ✅ sin cambios por login/grupo
            │   ├── EntityAttribute.java
            │   ├── DiagramEntity.java
            │   ├── RelationType.java
            │   ├── DiagramRelation.java
            │   ├── DiagramEntityRepository.java
            │   ├── DiagramRelationRepository.java
            │   ├── DiagramService.java
            │   ├── DiagramController.java
            │   └── dto/
            │       ├── AttributeDto.java
            │       ├── DiagramEntityRequest.java
            │       ├── DiagramEntityResponse.java
            │       ├── DiagramRelationRequest.java
            │       ├── DiagramRelationResponse.java
            │       └── DiagramResponse.java
            │
            ├── usuario/                                  ✅ login
            │   ├── Usuario.java                            # id, username, email, password(hash), fullname, createdAt
            │   ├── UsuarioRepository.java                  # findByUsername, findByUsernameOrEmail, existsBy...
            │   ├── UsuarioDetailsService.java               # implements UserDetailsService
            │   ├── AuthService.java                        # login(), register(), getPerfil()
            │   ├── AuthController.java                     # POST /api/auth/login, /register · GET /api/auth/me
            │   └── dto/
            │       ├── LoginRequest.java
            │       ├── RegisterRequest.java
            │       ├── AuthResponse.java
            │       └── UsuarioResponse.java
            │
            ├── grupo/                                    🔜 colaboración por equipos (paso 2 del orden acordado)
            │   ├── Grupo.java                              # id, nombre, descripcion, createdAt
            │   ├── GrupoMiembro.java                       # entidad puente: usuario_id, grupo_id, rol
            │   ├── RolGrupo.java                           # enum: ADMIN, MIEMBRO
            │   ├── GrupoRepository.java
            │   ├── GrupoMiembroRepository.java             # findByGrupoIdAndUsuarioId, findByUsuarioId
            │   ├── GrupoService.java                       # crear (creador=ADMIN), agregar/quitar miembro, validarMembresia
            │   ├── GrupoController.java                    # /api/groups, /api/groups/{id}/members
            │   └── dto/
            │       ├── GrupoRequest.java
            │       ├── GrupoResponse.java
            │       ├── MiembroRequest.java
            │       └── MiembroResponse.java
            │
            ├── xmi/                                      ⏳ Fase 3
            │   ├── XmiExportService.java                   # modelo interno → XML .xmi (UML 2.5)
            │   ├── XmiImportService.java                   # .xmi → modelo interno
            │   ├── XmiController.java                      # /api/projects/{id}/xmi/export|import
            │   └── dto/XmiImportResultResponse.java
            │
            ├── generator/                                ⏳ Fase 4
            │   ├── CodeGeneratorService.java               # aplica resources/templates/spring-boot/*
            │   ├── ZipPackager.java                        # empaqueta el proyecto generado en .zip
            │   ├── GeneratorController.java                # /api/projects/{id}/generate
            │   └── dto/GeneratorResultResponse.java
            │
            ├── vision/                                   ⏳ Fase 5.2
            │   ├── VisionController.java                   # sube foto de diagrama a mano
            │   ├── VisionService.java                      # llama IA de visión → JSON de diagrama
            │   └── dto/VisionResultResponse.java
            │
            └── collaboration/                            ⏳ Fase 6
                ├── DiagramSocketController.java            # @MessageMapping sobre /topic/diagrams/{id}
                ├── PresenceService.java                     # quién está conectado a cada diagrama
                └── dto/
                    ├── NodeEvent.java
                    ├── EdgeEvent.java
                    └── PresenceEvent.java
```

**Leyenda:** ✅ implementado y probado · 🔜 próximo paso acordado con el usuario (grupo) · ⏳ fase futura del Plan de Trabajo, sin iniciar ni diseñar en detalle todavía.
