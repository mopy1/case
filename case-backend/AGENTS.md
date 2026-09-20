# CASE Backend — Arquitectura y Árbol Proyectado

Fuente de verdad técnica exclusiva de `case-backend`. El `AGENTS.md` de la raíz del repo
solo enlaza para acá; el resumen de avance/decisiones para seguimiento del parcial vive en
el vault (`SW/Parcial1/backend/Backend.md`).

## Stack

Spring Boot, Java 21, PostgreSQL, JPA/Hibernate, Lombok, Spring Security + JWT (jjwt 0.12.6).

## 🔧 Fix real (2026-09-11): 401 vs 403 — faltaba distinguir "sin sesión" de "sin permiso"

Un JWT vencido o inválido devolvía **403**, exactamente el mismo código que usan las excepciones
de negocio (`AccesoDenegadoProyectoException`/`RolInsuficienteProyectoException` en
`GlobalExceptionHandler`, ej. un `LECTOR` intentando crear una tarea). El frontend no podía
distinguir "cerrá sesión y mandá a `/login`" de "mostrá el error tal cual" — se encontró
construyendo el manejo de sesión del frontend (ver `case-frontend/AGENTS.md`). Causa: `authorizeHttpRequests`
no tenía un `AuthenticationEntryPoint` configurado, así que Spring Security usaba el default (403)
para cualquier request sin autenticar, sin importar el motivo.

Se agregó `core/security/JwtAuthenticationEntryPoint.java` (implementa `AuthenticationEntryPoint`,
responde 401 con `setCharacterEncoding("UTF-8")` explícito — sin esto los acentos del mensaje
salían corruptos, `getWriter()` usa ISO-8859-1 por default) y se registró en
`SecurityConfig.filterChain()` vía `.exceptionHandling(exceptions ->
exceptions.authenticationEntryPoint(jwtAuthenticationEntryPoint))`. Esto **no** afecta los 403 de
negocio — esos se lanzan dentro de un request ya autenticado y pasan por `GlobalExceptionHandler`,
un mecanismo completamente distinto al `AuthenticationEntryPoint` de Spring Security. Verificado:
token vencido → 401 (el frontend desloguea), `LECTOR` sin permiso → sigue en 403 (el frontend solo
muestra el error, no desloguea).

## 🔧 Fix real (2026-09-07): CORS no permitía `PATCH`

`core/config/CorsConfig.java` tenía `allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")` —
sin `PATCH`. El único endpoint que usa `PATCH` (`PATCH /api/proyectos/{id}/tareas/{id}/estado`,
cambiar estado de una tarea) fallaba en el navegador con error de CORS en el preflight, aunque el
endpoint en sí funcionaba bien probado por `curl`. Se encontró recién al construir el frontend real
de Tareas — un `curl` no dispara preflight CORS, por eso no se había visto antes. Si se agrega
## ⚡ Optimización de Rendimiento Backend (2026-09-20)

- **Eliminación masiva de N+1 Queries:**
  - **Lienzo de Diagrama (`DiagramaService.obtenerDiagrama`):** Antes ejecutaba $1 + N + 1 + 2M$ consultas individuales (para 10 tablas y 10 relaciones eran más de 30 consultas SQL). Se añadió `AtributoEntidadRepository.findByProyectoId` para traer todos los atributos del proyecto en un único lote agrupado en memoria con `Collectors.groupingBy(a -> a.getEntidad().getId())`, y `@EntityGraph(attributePaths = {"entidadOrigen", "entidadDestino"})` en `RelacionDiagramaRepository.findByProyectoId`. Ahora carga el diagrama completo en **exactamente 3 consultas SQL**.
  - **Proyectos (`MiembroProyectoRepository`):** `@EntityGraph(attributePaths = {"proyecto"})` en `findByUsuarioId` para resolver membresías y proyectos asociados en un solo `JOIN`.
  - **Colaboradores (`MiembroProyectoRepository`):** `@EntityGraph(attributePaths = {"usuario"})` en `findByProyectoId`.
  - **Tareas y Notas (`TareaProyectoRepository` y `NotaProyectoRepository`):** `@EntityGraph(attributePaths = {"usuario"})` en `findByProyectoIdOrderByCreatedAtDesc` para evitar consultas diferidas por cada username asignado o autor de nota.
- **Conteo Directo en Base de Datos:**
  - En `ProyectoAccesoService.verificarNoEsUltimoAdmin`, se reemplazó la carga de todos los miembros en memoria de la JVM (`.stream().filter().count()`) por `miembroProyectoRepository.countByProyectoIdAndRol(proyectoId, Rol.ADMIN)` (`SELECT count(*)` directo en BD).
  - `ProyectoAccesoService` marcado como `@Transactional(readOnly = true)`.
- **Optimización Criptográfica de JWT (`JwtService` y `JwtAuthenticationFilter`):**
  - Se pre-calcula y almacena en caché la `SecretKey` HMAC en el constructor de `JwtService`, evitando decodificar Base64 y recrear la clave en cada solicitud HTTP entrante.
  - Se unificó la validación y extracción de claims en una sola pasada con `validateAndExtractClaims()`, eliminando la doble verificación criptográfica de firma que se realizaba por request en el filtro.
- **Cero cambios en modelos o BD:** Todas las entidades JPA en `model/` y el esquema DDL de PostgreSQL se mantuvieron 100% intactos.

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
- `core/security`: `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig`,
  `JwtAuthenticationEntryPoint` (2026-09-11, responde 401 ante falta de autenticación — ver
  fix arriba) — auth JWT stateless, `permitAll` solo en `/api/auth/login` y `/api/auth/register`,
  todo lo demás requiere `Authorization: Bearer <token>`.
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
- `modules/diagrama`: **tercer módulo de negocio, completo (2026-09-06, ampliado 2026-09-19/20).**
  Entidades (`EntidadDiagrama`), atributos (`AtributoEntidad`, soporte de FK) y relaciones
  (`RelacionDiagrama`, multiplicidad por lado, generación automática de tabla intermedia en N:M,
  y puntos de control manuales para polilíneas). Ver sección "Módulo diagrama" abajo.
- `modules/xmi`: **Fase 3 completa (2026-09-20).** Interoperabilidad bidireccional con Enterprise Architect
  (`XmiController`, `XmiExportService`, `XmiImportService`), compatible con dialecto EA (XMI 1.1) y
  dialecto propio (XMI 2.1), con detección de `UML:AssociationClass` y protección contra XXE.

## ⚠️ Reducción de alcance (2026-09-05 — *Superada*)

> [!NOTE]
> **Superado (2026-09-06 / 2026-09-20):** Ambos módulos fueron recreados y completados exitosamente
> en español (`modules/proyecto`, `modules/diagrama`) bajo la convención de subpaquetes, sumando
> además `modules/xmi` para interoperabilidad. El texto abajo se conserva como registro histórico
> de la decisión de arranque.

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
- `POST/PUT/DELETE /api/proyectos/{proyectoId}/relaciones[/{relacionId}]` — crear/editar/borrar
  relaciones entre entidades (`UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS` + `opcionalOrigen`/
  `opcionalDestino` por lado, 2026-09-19 — ver sección "Multiplicidad completa" más abajo).
- `PATCH /api/proyectos/{proyectoId}/relaciones/{relacionId}/puntos` — reemplaza la lista completa
  de puntos de control manuales de una relación (agregar/mover/quitar un punto son la misma
  operación: el frontend siempre manda la lista entera actualizada). Ver sección "Puntos de
  control de una relación" más abajo — **restaurado 2026-09-20**, después de haberse sacado por
  completo unas horas antes.
**Verificado end-to-end (2026-09-06):** crear entidades y atributos (incluida una FK real con
`referenciaEntidadId`), crear una relación, traer el diagrama completo con todo anidado, y los
casos límite: nombre de entidad/atributo duplicado (`409`), FK apuntando a una entidad de otro
proyecto (`400`), relación entre entidades de proyectos distintos (`400`), borrar una entidad
todavía referenciada por un FK (`409`, bloqueado a propósito), y borrar el proyecto entero con
todo el diagrama adentro (`204`, cascada real).

- `GET /api/proyectos/{proyectoId}/xmi/exportar` — descarga el lienzo completo como `.xmi`
  (`Content-Disposition: attachment`), cualquier miembro hasta `LECTOR`.
- `POST /api/proyectos/{proyectoId}/xmi/importar` (`multipart/form-data`, campo `archivo`) — lee
  un `.xmi` y recrea entidades/atributos/relaciones en el proyecto, mismo permiso de escritura que
  crear una entidad a mano. Ver sección "Interoperabilidad XMI" más abajo para el formato exacto.

**Verificado end-to-end (2026-09-20):** exportar el proyecto 16 (5 tablas, atributos con FK,
relación 1:N y una N:M con su tabla intermedia auto-generada) → reimportar ese mismo archivo en un
proyecto nuevo y vacío → mismas 5+1 tablas, mismos atributos (FK remapeada al `id` real de la
nueva entidad), mismas 4 relaciones (la N:M abstracta + las 2 físicas hacia la tabla intermedia +
la 1:N), sin duplicar la tabla intermedia. También el caso de error: reimportar el mismo archivo
en un proyecto que ya tiene esos nombres devuelve `409` (mismo `NombreDuplicadoDiagramaException`
de siempre) y **no deja nada a medio crear** — todo el `importar()` corre en una sola transacción
(`@Transactional` de clase), así que un fallo a mitad de las 3 pasadas revierte completo.

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

## Tabla intermedia automática en relaciones N:M (2026-09-19)

`RelacionDiagramaService.crear()` — al elegir `MUCHOS_A_MUCHOS`, además de guardar esa relación
tal cual (documenta la intención en el lienzo), crea sola su realización física: una
`EntidadDiagrama` nueva (`<origen>_<destino>`, con sufijo numérico si el nombre ya existe), dos
`AtributoEntidad` FK (`<origen>_id`/`<destino>_id`, `BIGINT`, `esPk=true`+`esFk=true`, apuntando a
cada lado) y dos `RelacionDiagrama` físicas `UNO_A_MUCHOS` (origen→intermedia, destino→intermedia).
**Por qué:** un N:M no existe como columna en un esquema relacional real — sin esto, el generador
de backend (Fase 4) no tendría de dónde sacar un `@ManyToOne`/`@JoinColumn` real para esa relación,
solo un enum sin sustento físico. Reusa `EntidadDiagramaService.crear()`/`AtributoEntidadService.agregar()`
en vez de duplicar lógica — mismo patrón de composición de services que ya usa el módulo.
`EntidadDiagramaService.existeNombre()` (package-private, nuevo) expone el chequeo de duplicados
para poder buscar un nombre libre sin repetir la excepción de `crear()`.

## Multiplicidad completa (0/1/N por lado) + editar relación (2026-09-19, superado más abajo)

`RelacionDiagrama` ganó `opcionalOrigen`/`opcionalDestino` (booleanos, `@ColumnDefault("false")` —
necesario para que Hibernate genere el `ALTER TABLE ... ADD COLUMN ... DEFAULT false NOT NULL` sin
romper las filas ya existentes; sin el default, Postgres rechaza agregar una columna `NOT NULL` a
una tabla con datos). Representan el "0" de la multiplicidad (`0..1`/`0..*`) por lado, aparte del
tope 1/N que ya daba `tipoRelacion` — el enum no cambia, solo se le suma esta capa.

**`PUT /api/proyectos/{proyectoId}/relaciones/{relacionId}` (nuevo)** —
`RelacionDiagramaService.actualizar()` permite editar una relación existente (tipo, opcionalidad
de cada lado, y hasta invertir origen/destino si el usuario cambia la dirección 1:N).

**Corregido (2026-09-19):** originalmente `actualizar()` a propósito NO disparaba la lógica de
tabla intermedia de `crear()` — la idea era que pasar a `MUCHOS_A_MUCHOS` editando no creara una
tabla intermedia retroactiva. Pero el frontend cambió ese mismo día: ya no existe un diálogo que
elija la relación completa de una — cada lado se edita por separado clickeando su multiplicidad
(ver `case-frontend/AGENTS.md`, *"Sin diálogo ni pill del medio..."*), así que llegar a N:M ahora
es un proceso incremental (un lado primero, el otro después) y no una elección atómica. Por eso
`actualizar()` ahora SÍ crea la tabla intermedia cuando la edición hace que la relación pase a ser
`MUCHOS_A_MUCHOS` y **antes no lo era** (compara `tipoAnterior` contra el `tipoRelacion` del
request) — mismo resultado sin importar si el N:M se armó al crear la relación o editando cada
punta por separado. Si ya era `MUCHOS_A_MUCHOS` y se guarda de nuevo (p.ej. solo cambió el
opcional de un lado), no se repite — ya tiene su tabla intermedia.

**Todo este esquema (`tipoRelacion` + `opcionalOrigen`/`opcionalDestino`) fue reemplazado el mismo
día — ver "Modelo de multiplicidad simplificado" más abajo, es el estado real actual.**

## Modelo de multiplicidad simplificado: `multiplicidadOrigen`/`multiplicidadDestino` (2026-09-19)

**Por qué se cambió (pedido explícito del usuario, cuestionando el diseño):** con el editor del
frontend permitiendo tocar cada lado de la relación por separado (click en el "(1..*)" de esa
punta), mantener `tipoRelacion` (`UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS`) +
`opcionalOrigen`/`opcionalDestino` obligaba a una capa de conversión en el frontend
(`lib/multiplicidad.ts`) que traducía "2 lados independientes" ↔ "tipo + 2 booleans", **e
invertía origen/destino** cada vez que un lado pasaba de "uno" a "muchos" (necesario porque
`UNO_A_MUCHOS` siempre asumía que el origen era el lado "1"). Eso producía un efecto visible raro:
la arista cambiaba de dirección en el lienzo (`"Edge from 16→17"` pasaba a `"17→16"`) solo por
editar un lado. El usuario preguntó directamente por qué no guardar cada lado de forma
independiente en vez de derivar todo de un "tipo" — tenía razón, era complejidad heredada de
sesiones anteriores, no una decisión pensada así desde el principio.

**Cambio de modelo:** `RelacionDiagrama.tipoRelacion` (enum `TipoRelacion`) + `opcionalOrigen`/
`opcionalDestino` (booleanos) → `multiplicidadOrigen`/`multiplicidadDestino` (nuevo enum
`RelacionDiagrama.Multiplicidad`: `UNO`/`CERO_O_UNO`/`UNO_O_MAS`/`CERO_O_MAS`, uno por lado,
totalmente independientes). `RelacionDiagrama.esMuchosAMuchos()` (nuevo método, reemplaza
`tipoRelacion == MUCHOS_A_MUCHOS`) deriva el N:M de los dos lados en vez de guardarlo aparte — ya
no hace falta un "tipo" separado, es 100% calculable. Sin inversión de origen/destino en ningún
lado del código nuevo: cada lado guarda su propia cardinalidad tal cual, sin importar cuál
entidad quedó como origen al arrastrar la conexión.

**Migración de datos real (no un `ddl-auto` a ciegas):** había 3 filas reales en el proyecto 10
antes de este cambio (`MUCHOS_A_MUCHOS` con ambos lados opcionales, y 2×`UNO_A_MUCHOS`
obligatorias). Como `ddl-auto=update` nunca hace `DROP COLUMN` ni sabe derivar un valor por fila
a partir de otras columnas, la migración se hizo a mano por SQL directo contra el contenedor
Postgres, en una sola transacción: agregar las 2 columnas nuevas nullable, backfillear cada fila
con un `CASE` que reproduce exactamente la vieja tabla `TOPE_UNO` del frontend (`MUCHOS_A_MUCHOS`
→ ambos lados tope N; `UNO_A_MUCHOS` → origen tope 1, destino tope N; si no, ambos tope 1) más el
booleano opcional viejo de cada lado, poner `NOT NULL` recién después de rellenar, y ahí sí
`DROP COLUMN` de `tipo_relacion`/`opcional_origen`/`opcional_destino`. Verificado fila por fila
después de migrar — nada se perdió. El backend se bajó (`docker compose stop backend-app`) antes
de tocar el esquema y se subió de nuevo ya con el modelo Java actualizado, así Hibernate nunca vio
un esquema a medio migrar.

**`crearRelacionFisica`** (las 2 relaciones 1:N hacia la tabla intermedia de un N:M) ahora fija
`multiplicidadOrigen = UNO`, `multiplicidadDestino = UNO_O_MAS` directo, sin pasar por el enum
`TipoRelacion` que ya no existe.

## Bug real corregido: relaciones recursivas y su tabla intermedia (2026-09-19)

El frontend bloqueaba a propósito crear una relación de una tabla consigo misma (ver
`case-frontend/AGENTS.md`) — el backend nunca tuvo ese problema (ninguna validación compara
`entidadOrigenId`/`entidadDestinoId`), pero **sí tenía un bug latente** en `crearTablaIntermedia`
que solo se manifestaba si algún día se permitía: si `origen` y `destino` son la misma entidad (una
N:M recursiva, ej. "usuario conoce a usuario"), las 2 columnas FK se armaban como
`<nombre>_id` para ambos lados — al ser la misma entidad, **el mismo nombre de columna dos
veces**, y la segunda llamada a `atributoEntidadService.agregar()` rompía con
`NombreDuplicadoDiagramaException` (409). Corregido: si `origen.getId().equals(destino.getId())`,
las columnas se nombran `<nombre>_origen_id`/`<nombre>_destino_id` en vez de `<nombre>_id` dos
veces. El nombre de la tabla intermedia (`origen_destino`, ej. "usuario_usuario") no tenía este
problema — `existeNombre` ya la desambigua con sufijo numérico si hiciera falta, igual que
cualquier otro nombre duplicado. Probado end-to-end: N:M recursiva completa, con su tabla
intermedia (`usuario_usuario`, columnas `usuario_origen_id`/`usuario_destino_id`) y su línea de
clase de asociación.

**Ajuste de posición (2026-09-20):** para una N:M recursiva, `posX` se calculaba igual que el
caso normal (`(origen.getPosX() + destino.getPosX()) / 2`) — como `origen` y `destino` son la
misma entidad, eso da exactamente `origen.getPosX()`, dejando la tabla intermedia centrada
justo debajo de la tarjeta recursiva. El frontend dibuja esa relación como un lazo que sale por
arriba de la tarjeta (ver `case-frontend/AGENTS.md`) y baja una línea punteada hacia la tabla
intermedia — con la tabla centrada debajo, esa línea terminaba cruzando el lazo. Ahora, si es
recursiva, `posX = origen.getPosX() + 350` (corrida al costado) en vez de promediar.

## Puntos de control de una relación — agregado, sacado y vuelto a agregar el mismo día (2026-09-20)

Se había agregado `RelacionDiagrama.puntosControl` (`List<PuntoControl>` vía
`@JdbcTypeCode(SqlTypes.JSON)` sobre `puntos_control jsonb`) + `PATCH .../relaciones/{id}/puntos`
para que el usuario pudiera redirigir una relación a mano (pedido: *"quiero manipular las
relaciones a libertad... que pasen por otro lado"*). Después de un par de rondas de ajuste (Ctrl
para no romper la relación sin querer, agrandar el área de agarre del punto, etc.) el usuario pidió
el enfoque de **dbdiagram.io** (anclaje automático a la fila exacta del atributo FK/PK, sin edición
manual de puntos) y la feature completa se sacó — ver el historial completo de ese round-trip
(borrado real de la columna, bug de deploy-ordering, etc.) en el `git log`/transcript de esa
sesión. Horas más tarde, pedido explícito **"volver a como estabas antes nomas"** — el usuario
prefería el sistema de puntos manuales al anclaje automático — así que se **reconstruyó desde
cero** (no había ningún commit de git de por medio para revertir; todo este ida y vuelta pasó
dentro de la misma sesión de trabajo sin commits intermedios):

- Recreados: `model/PuntoControl.java` (POJO simple con `x`/`y`, Lombok `@Getter @Setter`, no es
  una entidad JPA propia — no hace falta tabla aparte para 2 doubles por punto),
  `dto/PuntoControlDto.java` (record `x`/`y`), `dto/ActualizarPuntosControlRequest.java` (record
  con `List<PuntoControlDto> puntos` — reemplaza la lista completa, no hay operaciones por punto
  individual).
- `RelacionDiagrama.puntosControl` de vuelta en el modelo (mismo `@JdbcTypeCode(SqlTypes.JSON)`
  sobre `puntos_control jsonb`, default lista vacía); `RelacionDiagramaResponse.from()` lo mapea a
  `List<PuntoControlDto>`; `RelacionDiagramaService.actualizarPuntosControl()` (verifica
  membresía/permiso de escritura igual que el resto del service, reemplaza la lista entera) y el
  `PATCH .../relaciones/{id}/puntos` del controller, de vuelta.
- **La columna se recreó sola** — a diferencia de cuando se borró (que necesitó `DROP COLUMN` a
  mano), agregar una columna nueva SÍ lo hace `ddl-auto=update` automáticamente al arrancar el
  backend con el modelo actualizado. Sin migración manual esta vez.
- **No se restauró** la lectura de `case:puntosControl` en `XmiImportService.importarPropio` (el
  dialecto XMI 2.1 propio, ya no generado por `XmiExportService`, solo mantenido por compatibilidad
  con archivos viejos) — es un detalle menor de un dialecto legacy que ya no se exporta, no vale el
  riesgo de reconstruir el parseo XML exacto sin el archivo original a mano. Un `.xmi` de ese
  dialecto sigue importando bien, solo que sin puntos de control (cae al ruteo automático simple).
- **Lección de la vez que se borró, sigue vigente:** migrar el schema y redeployar el código nuevo
  tienen que ir juntos, nunca la migración de base sola primero (causó un `401` genérico
  enmascarando un `DataIntegrityViolationException` real — ver `JwtAuthenticationEntryPoint`). No
  aplicó esta vez porque agregar una columna es automático, pero sigue siendo la regla para
  cualquier futuro `DROP COLUMN`/`ALTER` que rompa compatibilidad con el JAR viejo.
- **Bug real corregido (mismo día, reportado como "entro al proyecto y me arroja el inicio de
  sesión de nuevo"):** `ddl-auto=update` agrega una columna nueva con `NULL` en TODAS las filas
  existentes, no la backfillea con `[]` — a diferencia del default del modelo Java
  (`puntosControl = new ArrayList<>()`), que solo aplica antes de que Hibernate hidrate la fila
  desde la base (el valor real de la columna, `null` para cualquier relación creada antes de este
  redeploy, pisa ese default). `RelacionDiagramaResponse.from()` llamaba directo
  `relacion.getPuntosControl().stream()` sin chequear null → `NullPointerException` en
  `GET .../diagrama` para **cualquier proyecto con al menos una relación ya existente** (134 filas
  afectadas en la base real de este entorno). El síntoma reportado por el usuario ("me manda al
  login") es el mismo patrón de la vez anterior: la excepción no autenticada terminó
  devolviendo un error que el frontend interpretó como sesión inválida. **Corregido con dos
  cambios:** `RelacionDiagramaResponse.from()` ahora trata `null` como lista vacía
  (`relacion.getPuntosControl() == null ? List.of() : ...`), y se corrió
  `UPDATE diagrama_relaciones SET puntos_control = '[]' WHERE puntos_control IS NULL` una sola vez
  contra la base real para limpiar el estado existente. **Lección nueva:** agregar una columna JSON
  con default en el modelo Java (`= new ArrayList<>()`) NO significa que las filas viejas la vayan
  a tener poblada — `ddl-auto=update` solo agrega la columna vacía (`NULL`), cualquier código que
  lea ese campo tiene que tolerar `null` explícitamente o backfillear antes de confiar en el
  default del lado Java.

## Interoperabilidad XMI (Fase 3, 2026-09-20) — módulo `xmi` nuevo

Pedido explícito: *"para el xmi ahora integralo ya toca"*. Módulo nuevo, `modules/xmi/`, sin
modelo/repositorio propio (transforma/lee lo que ya expone `modules/diagrama`, no guarda nada
nuevo) — solo `controller/` y `service/`.

**Formato del `.xmi` cambiado por completo (2026-09-20, pedido explícito): "para exportar sea el
mismo formato que el xmi de erp_bolivia... quiero que se vea simple, y con relación intermedia".**
El usuario trajo un `.xmi` real (`SI2/Proyecto/Database/erp_bolivia.xmi`, un ERP boliviano hecho
en Enterprise Architect / conversor DBML→XMI) y pidió que **el export** genere ese mismo dialecto,
no el propio (XMI 2.1) que se había hecho al principio de la Fase 3 — ver más abajo el porqué
`XmiImportService` sigue soportando ambos, aunque `XmiExportService` ya solo produzca uno.

**Dialecto actual, XMI 1.1 estilo Enterprise Architect** (namespace `UML:` con mayúscula, ids con
punto — `xmi.id`/`xmi.idref`, no `xmi:id`; sin namespace `xmi:` declarado, esos nombres con punto
son literales, no una URI de namespace real):
- `<XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3">` → `<XMI.header>` (documentación/metamodelo,
  cosmético) → `<XMI.content><UML:Model>` → **un solo** `<UML:Namespace.ownedElement>` plano, sin
  `UML:Package` — "simple" = sin carpetas/agrupación, a diferencia del archivo de referencia que
  agrupa las clases en 6 paquetes por módulo.
- Cada `EntidadDiagrama` (que no sea una tabla intermedia, ver abajo) → `UML:Class` con
  `<UML:ModelElement.stereotype><UML:Stereotype name="table"/></UML:ModelElement.stereotype>`.
- Cada `AtributoEntidad` → `UML:Attribute` con el tipo real anidado
  (`UML:StructuralFeature.type > UML:DataType xmi.idref="..."`, no un atributo plano `type=`) —
  un `UML:DataType` por cada `tipoSql` distinto usado en el proyecto, en minúscula (`bigint`,
  `varchar`, etc., igual que el archivo de referencia).
- **"Con relación intermedia" — cada N:M con tabla intermedia es UN SOLO
  `UML:AssociationClass`**, no 3 renglones sueltos como el modelo interno (una relación N:M
  abstracta + una entidad + 2 relaciones físicas 1:N). `detectarAsociacionesClase()` (nuevo en
  `XmiExportService`, **copia exacta en Java** de la misma heurística que ya usa el frontend en
  `useDiagramCanvas.ts`) encuentra ese patrón; la entidad-tabla-intermedia se exporta como
  `UML:AssociationClass` con estereotipo `intermedia` (mismo nombre de estereotipo que usa el
  archivo de referencia) — es a la vez una clase (con sus 2 atributos FK reales) y una asociación
  (`UML:Association.connection` con 2 `AssociationEnd`, multiplicidad real de la N:M original) — y
  las 3 relaciones que representaba se excluyen de la lista de `UML:Association` sueltas (ya están
  implícitas en el `AssociationClass`).
- El resto de las relaciones (1:1, 1:N normales) → `UML:Association` suelto con 2
  `UML:AssociationEnd` (`multiplicity="1"/"0..1"/"1..*"/"0..*"`, sin el tipo especial
  `LiteralUnlimitedNatural` del dialecto anterior — acá la multiplicidad es un string plano).

**Qué se pierde a propósito, por el pedido de "simple":** sin namespace `case:` de ningún tipo —
ni qué atributo puntual es FK (esa info sigue viva igual en la relación/AssociationClass, que sí
se recrea fiel), ni la posición en el lienzo (se reimporta con la cuadrícula por default). El
dialecto viejo SÍ guardaba ambas cosas sin pérdida vía un namespace propio — se sacrificó ese
detalle a cambio de un archivo que se ve exactamente como uno real de Enterprise Architect, sin
nada añadido que otra herramienta no entienda. Ver la sección "Puntos de control" más arriba para
el detalle de qué se guarda en la base — esto solo afecta el archivo `.xmi`, no lo que persiste.

**`XmiImportService` sigue reconociendo DOS dialectos** (`importar()` detecta cuál es mirando si
el documento tiene algún `UML:Class`/`UML:AssociationClass"; si no, asume el viejo):
1. **Enterprise Architect / DBML→XMI 1.1** (`importarDialectoEA`) — el que ahora también genera
   `XmiExportService`, y el que se usó para importar `erp_bolivia.xmi` de verdad (ver "Verificado
   end-to-end" abajo). Sin ninguna marca de PK/FK en el archivo (es de otra herramienta, no trae
   el `case:` propio) — se completa con dos heurísticas, documentadas en el Javadoc del método
   porque son aproximaciones, no datos reales del archivo: PK = atributo llamado "id" si existe,
   si no todos los que terminan en "_id" (clave compuesta, ej. tablas intermedia sin id propio);
   nullable = `false` para el/los PK, `true` para el resto. `esFk`/`referenciaEntidadId` de un
   atributo puntual quedan siempre en `false`/`null` — adivinar a qué clase apunta "categoria_id"
   por el nombre es demasiado frágil; la relación en sí (lo que importa para el diagrama y el
   generador de backend) se recrea igual de fiel vía `UML:Association`/`UML:AssociationClass`.
   Cuatro pasadas (clases+intermedia → atributos → asociaciones sueltas → cada
   `AssociationClass` arma las 3 relaciones que el modelo interno espera para que
   `detectarAsociacionesClase` del frontend la reconozca sin tocar nada ahí).
2. **Propio** (`importarPropio`, XMI 2.1) — el dialecto viejo, con su `case:` sin pérdida. Ya no lo
   genera `XmiExportService`, pero se dejó el soporte de lectura por si alguien todavía tiene un
   archivo exportado con la versión anterior de esta feature (mismo día, unas horas antes).

**Ninguno de los dos dispara `RelacionDiagramaService.crear()` normal para las relaciones** — los
dos usan `crearSinTablaIntermedia()` (bug real evitado a propósito: `crear()` normal, al ver una
relación `MUCHOS_A_MUCHOS`, crea sola su tabla intermedia — pero el archivo YA trae esa tabla
intermedia explícita, así que llamar a `crear()` normal la generaría DOS veces). Se extrajo
`crearRelacionCruda()` (privado) de la lógica compartida entre `crear()` (dispara la
auto-creación) y `crearSinTablaIntermedia()` (no la dispara, la usan ambos importadores).

**Seguridad — XXE:** el parser (`DocumentBuilderFactory`) tiene `disallow-doctype-decl=true` —
bloquea `DOCTYPE` por completo, la mitigación estándar de OWASP contra XXE (entidades externas,
"billion laughs") para cualquier parser que reciba un archivo subido por el usuario, que es
exactamente este caso (`POST .../xmi/importar` acepta un `.xmi` de cualquier miembro con permiso
de escritura).

**Verificado end-to-end (2026-09-20) con un archivo real, no solo el propio:**
1. Importado `erp_bolivia.xmi` (27 tablas + 9 tablas intermedia + 34 relaciones simples, un ERP
   completo hecho en Enterprise Architect, del vault de otro proyecto del usuario) en un proyecto
   nuevo → 36 entidades + 61 relaciones (34 simples + 9×3 del patrón de tabla intermedia) creadas
   correctamente, PK detectada bien en ambos casos (compuesta sin `id` propio vs. simple con `id`
   propio), sin errores en el lienzo con ese volumen.
2. Exportado ese mismo proyecto de vuelta → mismo conteo exacto (27 `UML:Class` + 9
   `UML:AssociationClass` + 34 `UML:Association`) que el archivo original.
3. Reimportado ese export en un tercer proyecto → otra vez 36 entidades + 61 relaciones,
   confirmando que el ciclo completo (EA real → nuestro modelo → nuestro export → nuestro modelo
   de nuevo) no pierde ni duplica nada.
4. Una N:M armada a mano en el editor (no importada) también exporta como un solo
   `UML:AssociationClass` limpio, sin ninguna `UML:Association` suelta residual para sus 3
   relaciones internas.

**Límite real, no resuelto a propósito:** `importarDialectoEA` busca los nombres de tag/atributo
tal cual los usa Enterprise Architect / el conversor DBML que generó el archivo de prueba
(`UML:Class`, `xmi.id`, etc., literal). Debería andar con cualquier archivo que use esos mismos
nombres (que es la convención real, no algo inventado para este archivo puntual), pero un XMI de
otra herramienta con nombres distintos no se probó — la prueba de ida y vuelta real abriendo el
`.xmi` exportado DENTRO de Enterprise Architect (punto 3.3 del Plan de Trabajo) sigue pendiente de
verificación manual por el usuario, no se pudo hacer en esta sesión (sin una instalación de EA
disponible acá).

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
│       ├── JwtAuthenticationEntryPoint.java   # responde 401 (falta de autenticación)
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
    │   │   ├── ActualizarPuntosControlRequest.java # record { List<PuntoControlDto> puntos } —
    │   │   │                                        #   reemplaza la lista entera, ver sección
    │   │   │                                        #   "Puntos de control" arriba
    │   │   ├── AtributoEntidadRequest.java
    │   │   ├── AtributoEntidadResponse.java
    │   │   ├── DiagramaResponse.java           # { entidades[], relaciones[] } de un proyecto
    │   │   ├── EntidadDiagramaRequest.java
    │   │   ├── EntidadDiagramaResponse.java    # incluye sus atributos anidados
    │   │   ├── PuntoControlDto.java            # record { x, y }
    │   │   ├── RelacionDiagramaRequest.java
    │   │   └── RelacionDiagramaResponse.java   # incluye puntosControl: List<PuntoControlDto>
    │   ├── exception/
    │   │   └── NombreDuplicadoDiagramaException.java
    │   ├── model/
    │   │   ├── AtributoEntidad.java    # columnas — es_pk/es_fk/referencia_entidad_id
    │   │   ├── EntidadDiagrama.java    # "tabla"/nodo del lienzo
    │   │   ├── PuntoControl.java       # POJO simple x/y — no es entidad JPA propia, va serializado
    │   │   │                           #   como JSON dentro de RelacionDiagrama.puntosControl
    │   │   └── RelacionDiagrama.java   # arista — multiplicidadOrigen/Destino (enum Multiplicidad,
    │   │                               #   2026-09-19, ver "Modelo de multiplicidad simplificado").
    │   │                               #   `puntosControl` (2026-09-20, agregado → sacado →
    │   │                               #   restaurado el mismo día, ver sección "Puntos de control"
    │   │                               #   arriba) — puntos de control manuales, JSON crudo
    │   ├── repository/
    │   │   ├── AtributoEntidadRepository.java
    │   │   ├── EntidadDiagramaRepository.java
    │   │   └── RelacionDiagramaRepository.java
    │   └── service/
    │       ├── AtributoEntidadService.java
    │       ├── DiagramaService.java
    │       ├── EntidadDiagramaService.java
    │       └── RelacionDiagramaService.java # incluye crearSinTablaIntermedia() (2026-09-20,
    │                                        # usado por XmiImportService — ver módulo xmi abajo) y
    │                                        # actualizarPuntosControl() (restaurado, ver arriba)
    ├── xmi/                    # ✅ (2026-09-20, nuevo) Fase 3 — interoperabilidad Enterprise
    │   │                       #   Architect, ver sección "Interoperabilidad XMI" más arriba.
    │   │                       #   Sin model/repository propio — transforma/lee lo que ya expone
    │   │                       #   `modules/diagrama`, no persiste nada nuevo
    │   ├── controller/
    │   │   └── XmiController.java   # GET .../xmi/exportar, POST .../xmi/importar (multipart)
    │   └── service/
    │       ├── XmiExportService.java  # DiagramaResponse -> XMI 1.1 estilo Enterprise Architect
    │       │                          # (2026-09-20, cambiado de formato — ver sección arriba).
    │       │                          # detectarAsociacionesClase() propia (copia en Java de la
    │       │                          # heurística del frontend) colapsa cada N:M+tabla intermedia
    │       │                          # en un solo UML:AssociationClass
    │       └── XmiImportService.java  # XML -> 3/4 pasadas según el dialecto detectado — sigue
    │                                  # leyendo el XMI 2.1 propio viejo (importarPropio) además del
    │                                  # nuevo estilo EA (importarDialectoEA), con protección XXE
    │                                  # (`disallow-doctype-decl`)
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
