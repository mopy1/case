# CASE Backend — Arquitectura y Árbol Proyectado

Fuente de verdad técnica exclusiva de `case-backend`. El `AGENTS.md` de la raíz del repo
solo enlaza para acá; el resumen de avance/decisiones para seguimiento del parcial vive en
el vault (`SW/Parcial1/backend/Backend.md`).

## Stack

Spring Boot, Java 21, PostgreSQL, JPA/Hibernate, Lombok, Spring Security + JWT (jjwt 0.12.6).

## 🔧 Fix real (2026-09-07): CORS no permitía `PATCH`

`core/config/CorsConfig.java` tenía `allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")` —
sin `PATCH`. El único endpoint que usa `PATCH` (`PATCH /api/proyectos/{id}/tareas/{id}/estado`,
cambiar estado de una tarea) fallaba en el navegador con error de CORS en el preflight, aunque el
endpoint en sí funcionaba bien probado por `curl`. Se encontró recién al construir el frontend real
de Tareas — un `curl` no dispara preflight CORS, por eso no se había visto antes. Si se agrega
algún otro endpoint `PATCH` en el futuro, ya está cubierto.

## Convención de paquetes (2026-09-05, guiada por `erp-backend`)

Cada módulo de negocio se organiza **por capa técnica en subpaquetes**, no con archivos
sueltos en la raíz del módulo — mismo patrón que `erp-backend` (`modules/seguridad/{controller,
dto,exception,model,repository,service}`):

```text
modules/<nombre_modulo>/
├── controller/   # Endpoints HTTP
├── dto/          # Request/Response (records)
├── exception/    # Excepciones específicas del módulo (no genéricas)
├── model/        # Entidades JPA
├── repository/   # Interfaces JpaRepository
└── service/      # Lógica de negocio
```

`core/` sigue siendo infraestructura transversal sin lógica de negocio: `core/config`
(CORS), `core/exception` (excepciones **genéricas**: `ResourceNotFoundException`,
`GlobalExceptionHandler` — las específicas de un módulo, como credenciales inválidas, viven
en el `exception/` de ese módulo), `core/security` (JWT).

## Paquete base: `com.casetool.backend`

- `core/config`: `CorsConfig`.
- `core/exception`: `ResourceNotFoundException`, `GlobalExceptionHandler`.
- `core/security`: `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` — auth JWT
  stateless, `permitAll` solo en `/api/auth/login` y `/api/auth/register`, todo lo demás
  requiere `Authorization: Bearer <token>`.
- `modules/seguridad`: login/register con JWT, sin bloqueo por intentos (simplificado a
  propósito, ver Backend.md del vault).
  - `controller/AuthController.java`
  - `dto/LoginRequest.java`, `RegisterRequest.java`, `AuthResponse.java`, `UsuarioResponse.java`
  - `exception/CredencialesInvalidasException.java`, `RecursoDuplicadoException.java`
  - `model/Usuario.java`, `UsuarioPrincipal.java` (adapta `Usuario` a `UserDetails`, expone `.getId()`)
  - `repository/UsuarioRepository.java`
  - `service/AuthService.java`, `UsuarioDetailsService.java`
- `modules/proyecto`: **segundo módulo de negocio, completo (2026-09-06).** CRUD de proyectos,
  colaboradores directos (roles `ADMIN`/`COLABORADOR`/`LECTOR`), notas de diseño y tareas — ver
  "Estado del módulo Proyecto" más abajo para el detalle completo.

## ⚠️ Reducción de alcance (2026-09-05)

Por pedido explícito del usuario, se **eliminaron** `modules/project` y `modules/diagram`
(CRUD de proyectos y modelo de diagrama UML — Fase 1 del Plan de Trabajo) para dejar el
backend con **solo login** mientras se termina de definir la arquitectura. Las tablas
`projects`, `diagram_entities`, `diagram_entity_attributes`, `diagram_relations` también se
borraron de la base (estaban vacías, sin dato real perdido). El código sigue existiendo en
el historial de git (`git log`) por si se necesita recuperarlo — no se perdió trabajo, se
sacó a propósito del alcance actual.

Cuando se retome `project`/`diagram`, deben seguir la convención de subpaquetes de arriba
(`controller/dto/exception/model/repository/service`), no el estilo flat que tenían antes.

## Dev local (sin Docker)

Cluster PostgreSQL nativo en el puerto `5433` (rol `lmc`, base `case_db`, password
`case_password123` — ver `application.properties`). Levantar con `./mvnw spring-boot:run`
(puerto `8081`).

## Docker

`Dockerfile` multi-stage (Maven build → `eclipse-temurin:21-jre`). Se levanta junto a Postgres y
al frontend vía `../docker-compose.yml` (raíz de `sw-case/`) — variables reales en `../.env`
(gitignoreado, ver `../.env.example`). Dentro del compose usa el Postgres del propio compose
(puerto `5434` en el host), no el cluster nativo. Verificado end-to-end tras la
reestructuración: `docker compose up -d` → login real vía `POST /api/auth/login` → JWT emitido.

**Usuario de prueba (bootstrap manual, no seed):** `demo` / `secreta123` — vive en el volumen
`case_pgdata`, se pierde si se resetea.

## Endpoints (todos los que existen hoy)

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (público solo login/register)
- `POST /api/proyectos`, `GET /api/proyectos`, `GET /api/proyectos/{id}`, `PUT /api/proyectos/{id}`,
  `DELETE /api/proyectos/{id}` — CRUD de proyectos, todo requiere JWT.
- `POST /api/proyectos/{proyectoId}/miembros`, `GET /api/proyectos/{proyectoId}/miembros`,
  `PATCH /api/proyectos/{proyectoId}/miembros/{usuarioObjetivoId}/rol`,
  `DELETE /api/proyectos/{proyectoId}/miembros/{usuarioObjetivoId}` — gestión de colaboradores
  (agregar/listar/cambiar rol/quitar), todo requiere rol `ADMIN` salvo listar.
- `POST /api/proyectos/{proyectoId}/notas`, `GET /api/proyectos/{proyectoId}/notas` — feed de
  decisiones de diseño (crear requiere no ser `LECTOR`, listar lo ve cualquier miembro).
- `POST /api/proyectos/{proyectoId}/tareas`, `GET /api/proyectos/{proyectoId}/tareas`,
  `GET /api/proyectos/{proyectoId}/tareas/{tareaId}`, `PUT /api/proyectos/{proyectoId}/tareas/{tareaId}`,
  `PATCH /api/proyectos/{proyectoId}/tareas/{tareaId}/estado`,
  `DELETE /api/proyectos/{proyectoId}/tareas/{tareaId}` — CRUD de tareas + cambio de estado.

**Verificado end-to-end (2026-09-06) contra Postgres real (docker, puerto 5434):** registro,
login, crear proyecto (queda `ADMIN` automático), listar, agregar colaborador, crear tarea,
listar tareas, crear nota, listar notas, y **borrar el proyecto — la cascada real de base de
datos funcionó** (`DELETE` → `204`, sin violación de FK, y el proyecto quedó realmente
eliminado). También verificados los casos límite: asignar tarea a alguien que no es miembro
(`403`), quitar/degradar al único `ADMIN` (`403`), y que un `LECTOR` no pueda crear tareas
(`403`).

- `GET /api/proyectos/{proyectoId}/diagrama` — lienzo completo (entidades con sus atributos +
  relaciones) en una sola respuesta, cualquier miembro (hasta `LECTOR`) puede verlo.
- `POST/PUT/DELETE /api/proyectos/{proyectoId}/entidades[/{entidadId}]` — CRUD de "tablas" del
  diagrama, requiere no ser `LECTOR`.
- `POST/PUT/DELETE /api/proyectos/{proyectoId}/entidades/{entidadId}/atributos[/{atributoId}]` —
  CRUD de columnas de una entidad.
- `POST/DELETE /api/proyectos/{proyectoId}/relaciones[/{relacionId}]` — crear/borrar relaciones
  entre entidades (`UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS`).

**Verificado end-to-end (2026-09-06):** crear entidades y atributos (incluida una FK real con
`referenciaEntidadId`), crear una relación, traer el diagrama completo con todo anidado, y los
casos límite: nombre de entidad/atributo duplicado (`409`), FK apuntando a una entidad de otro
proyecto (`400`), relación entre entidades de proyectos distintos (`400`), borrar una entidad
todavía referenciada por un FK (`409`, bloqueado a propósito), y borrar el proyecto entero con
todo el diagrama adentro (`204`, cascada real).

## Módulo `diagrama` (2026-09-06) — arreglos hechos al construirlo sobre el plan del vault

El vault (`Database.md`/`Database.canvas`) ya tenía este módulo diseñado, pero no era obligatorio
seguirlo al pie de la letra — al implementarlo aparecieron varios problemas reales que se
corrigieron:

- **Nombres de entidad y de atributo ahora son únicos** (`UNIQUE(proyecto_id, nombre)` en
  `EntidadDiagrama`, `UNIQUE(entidad_id, nombre)` en `AtributoEntidad`) — el plan original no lo
  tenía, y dos tablas o dos columnas con el mismo nombre rompen al generador de backend (Fase 4)
  más adelante, no solo se ven mal.
- **`posX`/`posY` → `pos_x`/`pos_y`** en la base — el vault los tenía en camelCase, inconsistente
  con el resto del esquema (`created_at`, `usuario_id`, etc., todo snake_case).
- **`referencia_entidad_id` es RESTRICT, no CASCADE** (a propósito, distinto del resto de las
  FK del módulo) — borrar una entidad que todavía es el destino de una FK de otro atributo debe
  **fallar**, no arrastrar o corromper la otra tabla en silencio.
  - **Efecto secundario real que esto causaba:** como Postgres chequea esa restricción al vuelo
    durante una cascada (no la difiere), borrar el **proyecto entero** también fallaba si había
    aunque sea una FK entre sus propias entidades — aunque técnicamente todo se fuera a borrar
    junto. Se resolvió agregando `AtributoEntidadRepository.limpiarReferenciasDeProyecto(id)`
    (pone en null esas referencias antes de borrar) y llamándolo desde
    `ProyectoService.eliminar()` justo antes del `delete`. Esto es la única dependencia de
    `modules/proyecto` hacia `modules/diagrama` — documentada a propósito, no accidental.
- **Validación cross-proyecto agregada** (no estaba en el plan): un atributo FK no puede
  referenciar una entidad de otro proyecto, y una relación no puede conectar entidades de
  proyectos distintos — ambas devuelven `400`. Mismo tipo de bug que el de "asignar tarea a
  alguien externo" del módulo `proyecto`, corregido antes de que llegara a existir esta vez.
- **`GlobalExceptionHandler` no manejaba `DataIntegrityViolationException`.** Sin esto, el
  bloqueo de `referencia_entidad_id` (arriba) devolvía un `403` vacío sin explicación en vez de
  un `409` claro — encontrado probando el caso, no evidente por revisión de código.
- `TipoRelacion` son identificadores Java reales (`UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS`),
  no los literales `1:1`/`1:N`/`N:M` del vault (un enum de Java no puede llamarse `1:1`).

## Árbol real actual

```text
case-backend/src/main/java/com/casetool/backend/
├── CaseBackendApplication.java
├── core/
│   ├── config/CorsConfig.java
│   ├── exception/
│   │   ├── ResourceNotFoundException.java
│   │   └── GlobalExceptionHandler.java
│   └── security/
│       ├── JwtService.java
│       ├── JwtAuthenticationFilter.java
│       └── SecurityConfig.java
└── modules/
    ├── proyecto/
    │   ├── controller/
    │   │   ├── MiembroProyectoController.java
    │   │   ├── NotaProyectoController.java
    │   │   ├── ProyectoController.java
    │   │   └── TareaProyectoController.java
    │   ├── dto/
    │   │   ├── CambiarEstadoTareaRequest.java
    │   │   ├── CambiarRolMiembroRequest.java
    │   │   ├── MiembroProyectoRequest.java
    │   │   ├── MiembroProyectoResponse.java
    │   │   ├── NotaProyectoRequest.java
    │   │   ├── NotaProyectoResponse.java
    │   │   ├── ProyectoRequest.java
    │   │   ├── ProyectoResponse.java
    │   │   ├── TareaProyectoRequest.java
    │   │   └── TareaProyectoResponse.java
    │   ├── exception/
    │   │   ├── AccesoDenegadoProyectoException.java
    │   │   ├── MiembroYaExisteException.java
    │   │   └── RolInsuficienteProyectoException.java
    │   ├── model/
    │   │   ├── MiembroProyecto.java   # Colaboradores (ADMIN, COLABORADOR, LECTOR)
    │   │   ├── NotaProyecto.java      # Registro/feed de decisiones de diseño
    │   │   ├── Proyecto.java          # Raíz del proyecto
    │   │   └── TareaProyecto.java     # Tareas internas (prioridades, estados)
    │   ├── repository/
    │   │   ├── MiembroProyectoRepository.java
    │   │   ├── NotaProyectoRepository.java
    │   │   ├── ProyectoRepository.java
    │   │   └── TareaProyectoRepository.java
    │   └── service/
    │       ├── MiembroProyectoService.java
    │       ├── NotaProyectoService.java
    │       ├── ProyectoAccesoService.java   # chequeos de membresía/rol compartidos
    │       ├── ProyectoService.java
    │       └── TareaProyectoService.java
    ├── diagrama/
    │   ├── controller/
    │   │   ├── AtributoEntidadController.java
    │   │   ├── DiagramaController.java        # GET del lienzo completo (entidades+relaciones)
    │   │   ├── EntidadDiagramaController.java
    │   │   └── RelacionDiagramaController.java
    │   ├── dto/
    │   │   ├── AtributoEntidadRequest.java
    │   │   ├── AtributoEntidadResponse.java
    │   │   ├── DiagramaResponse.java           # { entidades[], relaciones[] } de un proyecto
    │   │   ├── EntidadDiagramaRequest.java
    │   │   ├── EntidadDiagramaResponse.java    # incluye sus atributos anidados
    │   │   ├── RelacionDiagramaRequest.java
    │   │   └── RelacionDiagramaResponse.java
    │   ├── exception/
    │   │   └── NombreDuplicadoDiagramaException.java
    │   ├── model/
    │   │   ├── AtributoEntidad.java    # columnas — es_pk/es_fk/referencia_entidad_id
    │   │   ├── EntidadDiagrama.java    # "tabla"/nodo del lienzo
    │   │   └── RelacionDiagrama.java   # arista — enum TipoRelacion (UNO_A_UNO/UNO_A_MUCHOS/MUCHOS_A_MUCHOS)
    │   ├── repository/
    │   │   ├── AtributoEntidadRepository.java
    │   │   ├── EntidadDiagramaRepository.java
    │   │   └── RelacionDiagramaRepository.java
    │   └── service/
    │       ├── AtributoEntidadService.java
    │       ├── DiagramaService.java
    │       ├── EntidadDiagramaService.java
    │       └── RelacionDiagramaService.java
    └── seguridad/
        ├── controller/AuthController.java
        ├── dto/
        │   ├── LoginRequest.java
        │   ├── RegisterRequest.java
        │   ├── AuthResponse.java
        │   └── UsuarioResponse.java
        ├── exception/
        │   ├── CredencialesInvalidasException.java
        │   └── RecursoDuplicadoException.java
        ├── model/
        │   ├── Usuario.java
        │   └── UsuarioPrincipal.java   # adapta Usuario a UserDetails, expone getId()
        ├── repository/UsuarioRepository.java
        └── service/
            ├── AuthService.java
            └── UsuarioDetailsService.java
```

## Convención de idioma (2026-09-05/06)

Todos los **sustantivos de dominio** (entidades JPA, tablas, y los tipos del frontend que las
reflejan) van **en español**, para que toda la base de datos hable un solo idioma —
`Usuario`, `Proyecto`, `MiembroProyecto`, `NotaProyecto`, `TareaProyecto`. Los **sufijos técnicos** de
framework se quedan en inglés porque son convención de Spring/JPA, no vocabulario del negocio:
`Request`, `Response`, `Service`, `Controller`, `Repository`, `Exception`.

Esto corrige una inconsistencia detectada: el módulo `project`/`diagram` eliminado (ver abajo)
tenía sus entidades en inglés (`Project`, `DiagramEntity`, `EntityAttribute`, `DiagramRelation`,
`RelationType`) mientras `Usuario` ya estaba en español. Al recrear estos módulos, usar los
nombres en español: `Proyecto`, `EntidadDiagrama`, `AtributoEntidad`, `RelacionDiagrama`,
`TipoRelacion`.

## Estado del módulo Proyecto (2026-09-06)

- ✅ **Modelos JPA creados en `modules/proyecto/model/`:** `Proyecto`, `MiembroProyecto`, `NotaProyecto`, `TareaProyecto`.
- ✅ **Repositorios JPA creados en `modules/proyecto/repository/`:** `ProyectoRepository`, `MiembroProyectoRepository`, `NotaProyectoRepository`, `TareaProyectoRepository`.
- ✅ **DTOs creados en `modules/proyecto/dto/`:** records de Request y Response para proyectos, colaboradores, notas y tareas (incluye `CambiarEstadoTareaRequest`).
- ✅ **Excepciones creadas en `modules/proyecto/exception/`:** `AccesoDenegadoProyectoException`, `MiembroYaExisteException`, `RolInsuficienteProyectoException`, registradas en `GlobalExceptionHandler`.
- ✅ **`ProyectoService` creado (2026-09-06)** — CRUD de `Proyecto` + autorización por rol.
  Al crear un proyecto, el creador queda agregado automáticamente como `MiembroProyecto` con rol
  `ADMIN` (si no, nadie podría verlo/editarlo después). `actualizar`/`eliminar` requieren rol
  `ADMIN`; cualquier colaborador puede leer (`obtenerPorId`/`listarMisProyectos`).
- ✅ **Cascada real de base de datos al borrar un proyecto (2026-09-06).** `MiembroProyecto`,
  `NotaProyecto` y `TareaProyecto` tienen `@OnDelete(action = OnDeleteAction.CASCADE)` (Hibernate)
  en su `@ManyToOne` hacia `Proyecto` — Postgres borra esas filas solo al borrar el proyecto, sin
  importar por dónde llegue el delete (este service, otro código futuro, o hasta SQL directo).
  `ProyectoService.eliminar()` quedó simplificado a un solo `proyectoRepository.delete(proyecto)`
  — ya no hace falta borrado manual. **Pendiente cuando se construya `diagrama`:** agregar el
  mismo `@OnDelete` en `EntidadDiagrama`/`AtributoEntidad`/`RelacionDiagrama` hacia `Proyecto` (y
  en `AtributoEntidad`/`RelacionDiagrama` hacia `EntidadDiagrama`) — si no, sí va a hacer falta
  borrado manual para esas tablas.
- 🔧 **Fix aplicado (2026-09-06):** `MiembroProyecto` no tenía la restricción `UNIQUE
  (proyecto_id, usuario_id)` que ya estaba documentada en `Database.md`/`Database.canvas` desde
  el 05 — se agregó al `@Table`. Sin esto se podía agregar al mismo usuario dos veces al mismo
  proyecto.
- ✅ **Módulo `proyecto` completo (2026-09-06):** `MiembroProyectoService`, `NotaProyectoService`,
  `TareaProyectoService` (completado con `listarPorProyecto`/`obtenerPorId`/`actualizar`/
  `eliminar`, que faltaban) y los 4 `controller/` — todo construido, compilado y **verificado
  end-to-end** contra Postgres real (ver "Endpoints" abajo).
- ✅ **`ProyectoAccesoService` (nuevo, 2026-09-06):** helper compartido en `service/` con los
  chequeos de membresía/rol (`verificarMiembro`, `verificarPuedeEscribir`, `verificarRolAdmin`,
  `verificarEsMiembroDelProyecto`, `verificarNoEsUltimoAdmin`) que usan los 4 services del
  módulo — evita repetir la misma lógica de autorización 4 veces. `ProyectoService` y
  `TareaProyectoService` se refactorizaron para usarlo en vez de tener sus propios métodos
  privados duplicados.
- ✅ **`UsuarioPrincipal` (nuevo, en `modules/seguridad/model/`):** `UsuarioDetailsService` ahora
  devuelve esto en vez de un `User` genérico de Spring Security — expone `.getId()` además de
  `.getUsername()`, así los controllers sacan el id del usuario autenticado directo de
  `@AuthenticationPrincipal` sin una consulta extra a la base.
- 🔧 **Bug real corregido en `TareaProyectoService.crear` (2026-09-06):** la validación de "el
  usuario a asignar debe ser colaborador del proyecto" estaba mal escrita — comparaba el
  asignado contra el creador de la tarea (`usuario.getId() != miembro.getUsuario().getId()`,
  además con `!=` entre `Long` boxeados, que compara referencias no valores). En la práctica
  **solo dejaba asignarte tareas a vos mismo**, nunca a un compañero. Reemplazado por
  `accesoService.verificarEsMiembroDelProyecto(...)`.
- 🔧 **`TareaProyectoRequest.estado` eliminado del DTO.** Dejaba crear una tarea que ya nazca en
  `HECHO`. Ahora `crear()` siempre fuerza `PENDIENTE`; el único camino para cambiar el estado es
  `PATCH .../estado` (`CambiarEstadoTareaRequest`).
- 🔧 **`NotaProyectoRequest.motivo` ahora es `@NotBlank`.** Antes era opcional, lo que permitía
  notas sin justificación — contradice el propósito entero de la tabla (capturar el "por qué").
- 🔧 **Protección de "último ADMIN" agregada en `MiembroProyectoService`:** no se puede quitar ni
  degradar al único `ADMIN` de un proyecto (dejaría el proyecto sin nadie que pueda administrarlo).
- ⚠️ **Sigue pendiente, no bloqueante:** `ProyectoRepository.existsByNombre`/`findByNombre`
  chequean nombre **global**, no por usuario — no se usan hoy en `ProyectoService.crear` (a
  propósito), pero si en el futuro se usan para validar duplicados, ojo con ese alcance.

## Pendiente (fases futuras del Plan de Trabajo — sin iniciar, plan sin cambios)

- Fase 3: exportar/importar XMI hacia Enterprise Architect.
- Fase 4: generador de backend Spring Boot a partir del modelo. **Puede usar una IA real por
  API** (LLM) — corre desde la web con internet normal, el requisito "sin internet" del
  enunciado es solo para la app móvil (Fase 7), no para esto. Detalle en el vault.
- Fase 5.2: foto → modelo (endpoint de visión). Mismo caso: IA de visión real por API vía web,
  key que pone el usuario (BYOK, guardada solo en el navegador — ver decisión de "API keys" más
  abajo, no se persiste en el backend).
- Fase 6: colaboración en tiempo real (WebSocket/STOMP) — iría en `core/websocket` +
  `modules/collaboration`.
- **Descartado explícitamente (2026-09-05):** una bitácora de seguridad real para admin
  (`RegistroSeguridad`, eventos tipo login fallido/exitoso). Se evaluó y se decidió que no hace
  falta — el enunciado no la pide, no hay rol de admin todavía, y los logs estándar de Spring
  Boot (Logback a consola/archivo) ya cubren lo que se necesita para debug. Si en el futuro
  aparece una razón concreta (compliance, feature de admin real), se arma en ese momento — no
  antes. Ver el porqué completo en el vault.
- **API keys de IA (BYOK, 2026-09-06):** no se guardan en la base de datos. Se piden en el
  frontend, se guardan en `localStorage` del navegador (clave propia, ej. `ai_api_key`, separada
  de `token`/`user` para que un `localStorage.clear()` en el logout no se la lleve puesta), y se
  mandan por header (ej. `X-AI-Api-Key`) en cada request a los endpoints de IA — el backend la
  reenvía al proveedor y no la persiste ni la loguea. Motivo: una API key necesita cifrado
  reversible (no hash como el password) para poder usarse, lo que suma una superficie de riesgo
  real que este proyecto no necesita asumir.
