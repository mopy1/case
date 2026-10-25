# case-backend — Guía técnica (estado real del código)

API REST de la CASE Tool: usuarios + JWT, proyectos colaborativos (miembros con rol, tareas Kanban,
notas de diseño), diagramador de tablas/relaciones, exportación/importación XMI (Enterprise
Architect) y chat de equipo en vivo por proyecto (STOMP sobre WebSocket, Parcial 2 · F1). Todo lo de abajo está verificado contra el código fuente; si cambiás el código,
actualizá esta guía en el mismo cambio.

## 1. Stack (versiones reales del `pom.xml`)

| Pieza | Versión |
| :--- | :--- |
| Java | 21 |
| Spring Boot (parent) | **4.1.1** (Spring Framework 7.0.x, Spring Security 7.1.x, Tomcat 11) |
| Persistencia | Spring Data JPA + Hibernate 7.4 + PostgreSQL (driver 42.7) |
| Seguridad | JWT HMAC con JJWT 0.12.6, BCrypt, sesión `STATELESS` |
| Tiempo real | `spring-boot-starter-websocket`: STOMP 1.2 sobre WebSocket nativo (sin SockJS), simple broker en memoria |
| Otros | Lombok (solo en `model/`), Bean Validation, DOM XML del JDK para XMI |
| Build | Maven Wrapper `./mvnw` (Maven 3.9.16) |

No hay SpringDoc/Swagger, ni Flyway/Liquibase, ni perfiles (`application-*.properties`).

## 2. Árbol de carpetas (108 archivos `.java`: 103 en main + 5 test)

```text
case-backend/
├── pom.xml · mvnw · mvnw.cmd · .mvn/wrapper/
├── Dockerfile          # dev: compila con Maven dentro de la imagen y corre el jar (puerto 8081)
├── Dockerfile.prod     # prod: copia un target/*.jar YA compilado (deploy-aws.sh no lo compila)
├── src/main/resources/application.properties   # única configuración (static/ y templates/ vacíos)
├── src/test/java/com/casetool/backend/
│   ├── CaseBackendApplicationTests.java          # contextLoads (necesita BD)
│   ├── core/websocket/StompAuthInterceptorTest.java          # CONNECT/SUBSCRIBE/SEND (Mockito, sin BD)
│   ├── modules/chat/service/ChatMensajeServiceTest.java,     # paginación, clamp de limite, permisos, envío
│   │                        ChatMensajeServiceMencionIaTest.java,  # invocación async de IA ante @SeniorDev
│   │                        ChatMensajeRequestValidationTest.java, # Bean Validation del body
│   │                        ChatFixtures.java                      # entidades en memoria para los tests
│   └── modules/chat/ia/ChatMencionIaUtilsTest.java,          # regex @SeniorDev
│                       SeniorDevContextBuilderTest.java,     # ensamblado de prompt en 4 capas
│                       SeniorDevServiceTest.java             # orquestación async, locks, WS y fallback
└── src/main/java/com/casetool/backend/
    ├── CaseBackendApplication.java
    ├── core/
    │   ├── config/      CorsConfig
    │   ├── exception/   GlobalExceptionHandler, ResourceNotFoundException
    │   ├── security/    SecurityConfig, JwtService, JwtAuthenticationFilter, JwtAuthenticationEntryPoint
    │   └── websocket/   WebSocketConfig (/ws + broker /topic), StompAuthInterceptor (JWT y membresía por frame)
    └── modules/
        ├── seguridad/
        │   ├── controller/  AuthController
        │   ├── dto/         LoginRequest, RegisterRequest, AuthResponse, UsuarioResponse
        │   ├── exception/   CredencialesInvalidasException, RecursoDuplicadoException
        │   ├── model/       Usuario (@Entity), UsuarioPrincipal (UserDetails, expone getId())
        │   ├── repository/  UsuarioRepository
        │   └── service/     AuthService, UsuarioDetailsService
        ├── proyecto/
        │   ├── controller/  ProyectoController, MiembroProyectoController, TareaProyectoController,
        │   │                NotaProyectoController, ColaboracionController
        │   ├── dto/         ProyectoRequest/Response, MiembroProyectoRequest/Response, CambiarRolMiembroRequest,
        │   │                TareaProyectoRequest/Response, CambiarEstadoTareaRequest, NotaProyectoRequest/Response
        │   ├── exception/   AccesoDenegadoProyectoException, RolInsuficienteProyectoException, MiembroYaExisteException
        │   ├── model/       Proyecto, MiembroProyecto (enum Rol), TareaProyecto (enums Estado, Prioridad), NotaProyecto
        │   ├── repository/  ProyectoRepository, MiembroProyectoRepository, TareaProyectoRepository, NotaProyectoRepository
        │   └── service/     ProyectoService, MiembroProyectoService, TareaProyectoService, NotaProyectoService,
        │                    ProyectoAccesoService
        ├── diagrama/
        │   ├── controller/  DiagramaController, EntidadDiagramaController, AtributoEntidadController,
        │   │                RelacionDiagramaController
        │   ├── dto/         DiagramaResponse, EntidadDiagramaRequest/Response, AtributoEntidadRequest/Response,
        │   │                RelacionDiagramaRequest/Response, ActualizarPuntosControlRequest, PuntoControlDto
        │   ├── exception/   NombreDuplicadoDiagramaException
        │   ├── model/       EntidadDiagrama, AtributoEntidad, RelacionDiagrama (enums Multiplicidad,
        │   │                TipoRelacionUml), PuntoControl (POJO guardado como JSON, no es @Entity)
        │   ├── repository/  EntidadDiagramaRepository, AtributoEntidadRepository, RelacionDiagramaRepository
        │   └── service/     DiagramaService, EntidadDiagramaService, AtributoEntidadService,
        │                    RelacionDiagramaService, TablaIntermediaService
        ├── chat/
        │   ├── controller/  ChatController
        │   ├── dto/         ChatMensajeRequest, ChatMensajeResponse, ChatPresenciaResponse (UsuarioEnSala),
        │   │                ChatIaEstadoEvent (PENSANDO | RESPONDIDO | ERROR)
        │   ├── model/       ChatMensaje (@Entity, enum Tipo USUARIO/IA/SISTEMA, autorreferencia respuestaA)
        │   ├── repository/  ChatMensajeRepository
        │   ├── service/     ChatMensajeService, ChatPresenciaService, ChatPresenciaListener, ChatDestinos
        │   └── ia/          SeniorDevService (@Async orquestador), SeniorDevContextBuilder (4 capas),
        │                    SeniorDevProyectoFormatter, SeniorDevPrompts, DeepSeekClient (RestClient timeout 60s),
        │                    ChatMencionIaUtils (@seniordev regex), dto/ (DeepSeekChatRequest, DeepSeekChatResponse)
        └── xmi/             (sin model/repository propios: usa los services de diagrama)
            ├── controller/  XmiController
            ├── dto/         ModoImportacionXmi (FUSIONAR | REEMPLAZAR), XmiPreviewResponse
            └── service/     XmiExportService, XmiAsociacionesClase, XmiClasesUml, XmiRelacionesUml, XmiDiagramaUml,
                             XmiImportService, XmiImportEA, XmiImportPropio, XmiCreadorEntidades, XmiMapeoEA, XmiDom
```

## 3. Lógica por módulo

**core**
- `SecurityConfig`: CSRF off, CORS on, `STATELESS`. Públicos solo `POST /api/auth/login` y
  `POST /api/auth/register`, el handshake `/ws` (el JWT se valida en el frame STOMP), más el dispatch interno de `/error` (`DispatcherType.ERROR`, para que
  un 400/404/500 no manejado no se convierta en 401 y cierre la sesión del frontend); todo lo demás
  exige JWT. `BCryptPasswordEncoder` como bean.
- `JwtAuthenticationFilter`: lee `Authorization: Bearer <token>`, valida firma+expiración
  (`JwtService.validateAndExtractClaims`) y carga el usuario por `sub` (username). Token inválido →
  la request sigue sin autenticar (no lanza).
- `JwtService`: genera tokens con `sub=username`, claim `userId`, expiración `jwt.expiration-ms`.
- `JwtAuthenticationEntryPoint`: sin autenticación → **401** JSON (distinto del 403 de rol).
- `CorsConfig`: `/api/**`, orígenes desde `cors.allowed-origins` (lista separada por comas).
- `GlobalExceptionHandler`: cuerpo `{timestamp, status, error, message}` (el frontend lee `message`).
  Un query/path de tipo incorrecto (`?limite=abc`) da 400 con ese mismo cuerpo.
- `websocket/WebSocketConfig`: endpoint `/ws` (orígenes = `cors.allowed-origins`), `enableSimpleBroker("/topic")`
  con heartbeat servidor 10 s/10 s y el `messageBrokerTaskScheduler`. No hay destinos `/app`.
- `websocket/StompAuthInterceptor` (canal inbound): `CONNECT` exige header nativo
  `Authorization: Bearer <jwt>` → si falta/es inválido/usuario borrado lanza `"401 Token inválido o ausente"`;
  `SUBSCRIBE` solo a `/topic/proyectos/{id}/chat(/presencia)?` siendo miembro (`"403 Destino no permitido"` /
  `"403 No sos colaborador de este proyecto"`); `SEND` siempre `"403 Los mensajes se envían por REST"`.
  Spring responde frame `ERROR` (header `message`) y cierra la conexión.

**seguridad**: registro (username/email únicos → 409), login por username **o** email (falla → 401
"Credenciales incorrectas"), `/me` con el perfil. `UsuarioPrincipal` permite usar
`@AuthenticationPrincipal UsuarioPrincipal principal` y `principal.getId()` en los controllers.

**proyecto**
- Autorización centralizada en `ProyectoAccesoService`: `verificarMiembro` (403 si no es miembro),
  `verificarPuedeEscribir` (403 si es LECTOR), `verificarRolAdmin` (403 si no es ADMIN),
  `verificarNoEsUltimoAdmin` (403 al quitar/degradar al único ADMIN).
- Crear proyecto agrega al creador como ADMIN. Borrar proyecto primero anula las FK
  `referencia_entidad_id` del diagrama (son RESTRICT) y luego confía en el `ON DELETE CASCADE` de BD.
- `ColaboracionController`: presencia en memoria (`ConcurrentHashMap` estático, no BD). Cada
  heartbeat guarda cursor/selección, purga sesiones con > 3,5 s sin actividad y devuelve a los
  demás. Se pierde al reiniciar y no escala a más de una instancia.

**chat** (Parcial 2 · F1 + F2 Senior Dev IA)
- Leer y escribir = cualquier miembro, **incluido LECTOR** (decisión D1: el chat no modifica el modelo).
- `ChatMensajeService.listar`: `limite` default 30 recortado a `[1,100]`; `antesDe` = cursor por `id`;
  consulta `created_at DESC, id DESC` con `Limit` + `@EntityGraph(usuario)`, se invierte y sale ascendente.
  El `rol` de cada autor (actual) sale de 1 consulta de miembros → `Map` (sin N+1).
- `enviar`: `strip()` del contenido (vacío → 400), `tipo=USUARIO`, `saveAndFlush` y después
  `convertAndSend("/topic/proyectos/{id}/chat", respuesta)`. Si el mensaje contiene `@SeniorDev`
  (`ChatMencionIaUtils.contieneMencionSeniorDev`), dispara de forma asíncrona (`@Async`) a `SeniorDevService.procesarMencion`.
- Senior Dev IA (`SeniorDevService`, orquestación asíncrona F2):
  - Lock por proyecto en `ConcurrentHashMap<Long, ReentrantLock>` para garantizar secuencia en la sala.
  - Emite estado `PENSANDO` a `/topic/proyectos/{id}/chat/ia`.
  - Construye el contexto en 4 capas (`SeniorDevContextBuilder` + `SeniorDevProyectoFormatter`):
    1) System prompt con rol de Senior Dev mentor y directrices rigurosas en español.
    2) Estado del proyecto compacto (entidades, columnas PK/FK, relaciones con multiplicidades, tareas Kanban, notas ADR).
    3) Historial reciente de la sala (~30 mensajes formateados `[username · ROL]: contenido`).
    4) Consulta actual del disparador.
  - Invoca `DeepSeekClient` (`RestClient` configurable mediante `application.properties`, timeout 60s).
  - Guarda la respuesta como `ChatMensaje` (`tipo=IA`, `usuario=null`, `respuestaA=disparador`).
  - Difunde a `/topic/proyectos/{id}/chat` y emite estado `RESPONDIDO` a `/topic/proyectos/{id}/chat/ia`.
  - Fallback elegante: si la API key está vacía o DeepSeek falla (timeout, 401, 429), guarda y difunde un mensaje `tipo=SISTEMA` con explicación amigable y emite estado `ERROR` sin romper la transacción ni la sala.
- Presencia (`ChatPresenciaService`, en memoria, igual que `ColaboracionController`): cuenta una
  suscripción a `.../chat/presencia` (decisión D2: "en la sala" = tiene el proyecto abierto). Clave
  `sessionId:subscriptionId`; `ChatPresenciaListener` escucha Subscribe/Unsubscribe/Disconnect y cada
  cambio difunde la lista completa (dedupe por usuario, orden por username). Se pierde al reiniciar.
- `ChatDestinos`: arma y parsea los tópicos (mensajes `/chat`, presencia `/chat/presencia`, estado IA `/chat/ia`).

**diagrama**
- `DiagramaService.obtenerDiagrama`: 3 consultas fijas (entidades, atributos del proyecto,
  relaciones con `@EntityGraph`) y agrupa atributos en memoria — sin N+1.
- Nombres únicos: entidad por proyecto, atributo por entidad (409 si se repite).
- Atributo FK: exige `referenciaEntidadId` de una entidad del mismo proyecto (400 si no).
- Relación: `multiplicidadOrigen/Destino` ∈ `UNO, CERO_O_UNO, UNO_O_MAS, CERO_O_MAS`;
  `tipo` ∈ `ASOCIACION, COMPOSICION, AGREGACION, HERENCIA` (default ASOCIACION).
- N:M (ambos lados "muchos") → `TablaIntermediaService` crea sola la tabla `origen_destino` con 2
  atributos PK+FK `BIGINT` y 2 relaciones físicas `UNO → UNO_O_MAS`. También al editar una relación
  que pasa a ser N:M. Caso recursivo: columnas `_origen_id` / `_destino_id`.
- Puntos de control: `PATCH .../puntos` reemplaza la lista completa (jsonb).

**xmi**
- Export (`GET`): XMI 1.1 estilo Enterprise Architect, plano (sin `UML:Package`). Cada N:M con
  tabla intermedia sale como un `UML:AssociationClass` (`XmiAsociacionesClase`); herencia como
  `UML:Generalization`; posiciones del lienzo en `UML:Diagram` (`XmiDiagramaUml`).
- Import: solo ADMIN, todo en una transacción. Parsea con DOCTYPE deshabilitado (anti-XXE,
  `XmiDom.parsear`) **antes** de borrar nada. Detecta dialecto: EA/XMI 1.1 (`XmiImportEA`) o
  propio XMI 2.1 viejo (`XmiImportPropio`). `FUSIONAR` reusa entidades con el mismo nombre sin
  tocarlas; `REEMPLAZAR` vacía el diagrama primero. Las relaciones importadas usan
  `crearSinTablaIntermedia` (el archivo ya trae la intermedia). Heurística EA: PK = atributo "id"
  (o todos los `*_id` si no hay "id"); FK de columna no se infiere.
- `previsualizar`: no escribe nada; devuelve tablas del archivo, cuáles ya existen y totales.

## 4. Endpoints (todos bajo `/api`, JSON salvo XMI)

Rol: **Público** = sin token · **Auth** = cualquier usuario con JWT · **Miembro** = cualquier rol
del proyecto · **Escritor** = ADMIN o COLABORADOR (no LECTOR) · **ADMIN**.

| Método | Ruta | Rol | Éxito | Notas |
| :--- | :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Público | 201 `AuthResponse` | `{username, email, password}` (password 6..255) |
| POST | `/api/auth/login` | Público | 200 `AuthResponse` | `{usernameOrEmail, password}` → `{id, username, email, token}` |
| GET | `/api/auth/me` | Auth | 200 `UsuarioResponse` | `{id, username, email, createdAt}` |
| GET | `/api/proyectos` | Auth | 200 lista | Proyectos donde el usuario es miembro, con `miRol` |
| POST | `/api/proyectos` | Auth | 201 | `{nombre, descripcion}`; el creador queda ADMIN |
| GET | `/api/proyectos/{proyectoId}` | Miembro | 200 | `{id, nombre, descripcion, miRol, createdAt}` |
| PUT | `/api/proyectos/{proyectoId}` | ADMIN | 200 | `{nombre, descripcion}` |
| DELETE | `/api/proyectos/{proyectoId}` | ADMIN | 204 | Cascada en BD |
| GET | `/api/proyectos/{proyectoId}/miembros` | Miembro | 200 lista | `{id, usuarioId, username, email, rol, createdAt}` |
| POST | `/api/proyectos/{proyectoId}/miembros` | ADMIN | 201 | `{usernameOrEmail, rol}`; 409 si ya es miembro |
| PATCH | `/api/proyectos/{proyectoId}/miembros/{usuarioObjetivoId}/rol` | ADMIN | 200 | `{rol}`; protege al último ADMIN |
| DELETE | `/api/proyectos/{proyectoId}/miembros/{usuarioObjetivoId}` | ADMIN | 204 | Protege al último ADMIN |
| GET | `/api/proyectos/{proyectoId}/tareas` | Miembro | 200 lista | Orden `createdAt` desc |
| POST | `/api/proyectos/{proyectoId}/tareas` | Escritor | 201 | `{titulo, descripcion, usuarioId?, prioridad}`; nace `PENDIENTE` |
| GET | `/api/proyectos/{proyectoId}/tareas/{tareaId}` | Miembro | 200 | |
| PUT | `/api/proyectos/{proyectoId}/tareas/{tareaId}` | Escritor | 200 | Mismo body que POST (no cambia estado) |
| PATCH | `/api/proyectos/{proyectoId}/tareas/{tareaId}/estado` | Escritor | 200 | `{estado}`: `PENDIENTE`, `EN_PROGRESO`, `HECHO` |
| DELETE | `/api/proyectos/{proyectoId}/tareas/{tareaId}` | Escritor | 204 | |
| GET | `/api/proyectos/{proyectoId}/notas` | Miembro | 200 lista | Orden `createdAt` desc |
| POST | `/api/proyectos/{proyectoId}/notas` | Escritor | 201 | `{accion (≤100), motivo}`; no hay editar/borrar |
| GET | `/api/proyectos/{proyectoId}/chat/mensajes?antesDe=&limite=` | Miembro | 200 `ChatMensajeResponse[]` | Ascendente; `limite` 30 (1..100, recorta); `antesDe` = ids menores; no numérico → 400 |
| POST | `/api/proyectos/{proyectoId}/chat/mensajes` | Miembro (incl. LECTOR) | 201 `ChatMensajeResponse` | `{contenido}` 1..4000 (strip); además difunde por WS |
| GET | `/api/proyectos/{proyectoId}/chat/presencia` | Miembro | 200 `ChatPresenciaResponse` | `{proyectoId, usuarios:[{usuarioId, username}]}` |
| POST | `/api/proyectos/{proyectoId}/colaboracion/presencia` | Auth | 200 lista | Body libre: `clientId` (obligatorio, si falta 400), `username`, `color`, `cursor{x,y}`, `selectedEntityId` |
| POST | `/api/proyectos/{proyectoId}/colaboracion/desconectar` | Auth | 200 vacío | `{clientId}` |
| GET | `/api/proyectos/{proyectoId}/diagrama` | Miembro | 200 | `{entidades[ {.., atributos[]} ], relaciones[]}` |
| POST | `/api/proyectos/{proyectoId}/entidades` | Escritor | 201 | `{nombre, posX, posY}` |
| PUT | `/api/proyectos/{proyectoId}/entidades/{entidadId}` | Escritor | 200 | Nombre y posición |
| DELETE | `/api/proyectos/{proyectoId}/entidades/{entidadId}` | Escritor | 204 | 409 si otra entidad la referencia por FK |
| POST | `/api/proyectos/{proyectoId}/entidades/{entidadId}/atributos` | Escritor | 201 | `{nombre, tipoSql, esPk, esFk, referenciaEntidadId?, nullable}` |
| PUT | `/api/proyectos/{proyectoId}/entidades/{entidadId}/atributos/{atributoId}` | Escritor | 200 | Mismo body |
| DELETE | `/api/proyectos/{proyectoId}/entidades/{entidadId}/atributos/{atributoId}` | Escritor | 204 | |
| POST | `/api/proyectos/{proyectoId}/relaciones` | Escritor | 201 | `{entidadOrigenId, entidadDestinoId, multiplicidadOrigen, multiplicidadDestino, tipo?}`; N:M crea tabla intermedia |
| PUT | `/api/proyectos/{proyectoId}/relaciones/{relacionId}` | Escritor | 200 | Mismo body |
| PATCH | `/api/proyectos/{proyectoId}/relaciones/{relacionId}/puntos` | Escritor | 200 | `{puntos:[{x,y}]}` reemplaza la lista |
| DELETE | `/api/proyectos/{proyectoId}/relaciones/{relacionId}` | Escritor | 204 | |
| GET | `/api/proyectos/{proyectoId}/xmi/exportar` | Miembro | 200 XML | Descarga `diagrama-{id}.xmi` |
| POST | `/api/proyectos/{proyectoId}/xmi/previsualizar` | ADMIN | 200 `XmiPreviewResponse` | multipart, campo `archivo` |
| POST | `/api/proyectos/{proyectoId}/xmi/importar?modo=FUSIONAR\|REEMPLAZAR` | ADMIN | 200 `DiagramaResponse` | multipart `archivo`; `modo` default FUSIONAR |

Total: **39 endpoints REST** (36 previos + 3 del chat; contado con `grep` de `@*Mapping`). `ChatMensajeResponse` = `{id, proyectoId, usuarioId, username, rol, tipo,
contenido, respuestaAId, createdAt}` (`usuarioId/username/rol` null si `tipo != USUARIO`; `rol` null si el
autor ya no es miembro; `respuestaAId` null en F1).

**WebSocket (STOMP 1.2)** — `ws(s)://<host>/ws`, sin SockJS. CONNECT con header nativo
`Authorization: Bearer <jwt>`; heartbeat 10000,10000. Destinos (solo server → cliente):
`/topic/proyectos/{id}/chat` (cada mensaje, payload `ChatMensajeResponse`),
`/topic/proyectos/{id}/chat/ia` (eventos de estado IA: PENSANDO, RESPONDIDO, ERROR, payload `ChatIaEstadoEvent`), y
`/topic/proyectos/{id}/chat/presencia` (al entrar/salir alguien, payload `ChatPresenciaResponse`, lista
completa). Errores: frame `ERROR` con `message` `401 …` / `403 …` y cierre. En Nginx (`case-frontend/nginx*.conf`)
`location = /ws` con `Upgrade`/`Connection: upgrade` y timeouts de 3600 s.

Detalle: en las rutas anidadas (`/tareas/{tareaId}`, `/entidades/{entidadId}/atributos/{atributoId}`,
`/relaciones/{relacionId}`) el permiso se valida contra el proyecto real del recurso; el
`{proyectoId}`/`{entidadId}` del path no se cruza con el recurso.

Errores (`GlobalExceptionHandler`): 400 validación (`campo: mensaje; ...`) o `IllegalArgumentException`;
401 sin token / credenciales malas; 403 no miembro o rol insuficiente; 404 recurso inexistente;
409 nombre/usuario duplicado o violación de integridad en BD.

## 5. Modelo de datos (9 tablas, Hibernate `ddl-auto=update`, sin migraciones)

| Tabla | Columnas clave | Restricciones |
| :--- | :--- | :--- |
| `usuarios` | `id`, `username`(50), `email`(100), `password`(255, hash BCrypt), `created_at` | `username` y `email` únicos |
| `proyectos` | `id`, `nombre`(100), `descripcion` TEXT, `created_at` | |
| `miembros_proyecto` | `id`, `proyecto_id`, `usuario_id`, `rol`(20: ADMIN/COLABORADOR/LECTOR), `created_at` | único (`proyecto_id`,`usuario_id`); `proyecto_id` ON DELETE CASCADE |
| `tareas_proyecto` | `id`, `proyecto_id`, `usuario_id` (asignado, nullable), `titulo`(150), `descripcion` TEXT, `prioridad`(20), `estado`(20), `created_at` | `proyecto_id` CASCADE |
| `notas_proyecto` | `id`, `proyecto_id`, `usuario_id` (autor), `accion`(100), `motivo` TEXT, `created_at` | `proyecto_id` CASCADE |
| `diagrama_entidades` | `id`, `proyecto_id`, `nombre`(100), `pos_x`, `pos_y`, `created_at` | único (`proyecto_id`,`nombre`); CASCADE |
| `entidad_atributos` | `id`, `entidad_id`, `nombre`(100), `tipo_sql`(50), `es_pk`, `es_fk`, `referencia_entidad_id` (nullable), `nullable`, `created_at` | único (`entidad_id`,`nombre`); `entidad_id` CASCADE; `referencia_entidad_id` **RESTRICT a propósito** |
| `chat_mensajes` | `id`, `proyecto_id`, `usuario_id` (nullable: null = IA/SISTEMA), `tipo`(20: USUARIO/IA/SISTEMA), `contenido` TEXT, `respuesta_a_id` (nullable, FK a sí misma), `created_at` | `proyecto_id` CASCADE; `respuesta_a_id` SET NULL; índice `idx_chat_mensajes_proyecto_created` (`proyecto_id`,`created_at`); CHECK de `tipo` (agregar un valor exige `ALTER TABLE` manual) |
| `diagrama_relaciones` | `id`, `proyecto_id`, `entidad_origen_id`, `entidad_destino_id`, `multiplicidad_origen`(20), `multiplicidad_destino`(20), `tipo`(20, nullable), `puntos_control` jsonb, `created_at` | las 3 FK con CASCADE |

Enums se guardan como texto (`@Enumerated(STRING)`). Las FK a `usuarios` no tienen cascada (no
existe endpoint para borrar usuarios).

## 6. Configuración (`application.properties`, sin perfiles)

| Propiedad | Variable de entorno | Default en el archivo |
| :--- | :--- | :--- |
| `spring.config.import` | — | `optional:file:../.env[.properties]`: fuera de Docker lee el `.env` de la raíz del repo (aporta `POSTGRES_PASSWORD`); en Docker no existe y se ignora |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5434/case_db` (el `case_postgres` de `docker-compose.yml`) |
| `spring.datasource.username` / `password` | `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD` | `case_user` / `${POSTGRES_PASSWORD}` del `.env` (sin contraseña versionada) |
| `spring.jpa.hibernate.ddl-auto` | `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` |
| `spring.jpa.show-sql` | `SPRING_JPA_SHOW_SQL` | `true` |
| `cors.allowed-origins` | `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` (lista con comas) |
| `jwt.secret` | `JWT_SECRET` (Base64, ≥ 256 bits) | clave de desarrollo pública — **debe** sobreescribirse en prod |
| `jwt.expiration-ms` | `JWT_EXPIRATION_MS` | `86400000` (24 h) |
| `server.port` | `SERVER_PORT` | `8081` |

`docker-compose.yml` / `docker-compose.prod.yml` (raíz del repo) pasan al contenedor
`case_backend`: `SPRING_DATASOURCE_*` (host `postgres-db:5432`), `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
y `CORS_ALLOWED_ORIGINS` (`*` en prod). Solo `docker-compose.prod.yml` pasa `JWT_SECRET`, y es
obligatoria (`${JWT_SECRET:?...}`): sin ella en el `.env` del servidor, compose falla en vez de
arrancar con la clave de desarrollo. Generarla con `openssl rand -base64 48`. Dev local usa el default.

## 7. Compilar, probar, correr

```bash
cd case-backend
./mvnw -q -DskipTests compile        # verificación mínima obligatoria
./mvnw -q test                       # contextLoads necesita Postgres accesible; el resto son unitarios
./mvnw -q test -Dtest='Chat*Test,Stomp*Test'   # solo los unitarios del chat (sin BD)
# Sin BD, para validar solo el cableado de beans:
./mvnw -q test -Dspring.jpa.hibernate.ddl-auto=none \
  -Dspring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect \
  -Dspring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false
./mvnw spring-boot:run               # local: solo requiere `docker compose up -d postgres-db` (toma la clave del .env raíz)
./mvnw -DskipTests package           # genera target/*.jar (lo necesita Dockerfile.prod)
```

## 8. Reglas para agentes

1. Ningún archivo de código > 150 líneas. Si crece, extraer una clase con nombre de responsabilidad
   (ej. `TablaIntermediaService`, `XmiMapeoEA`), no "Utils" genéricos.
2. No modificar entidades JPA ni esquema (columnas, tablas, relaciones) sin pedido explícito:
   con `ddl-auto=update` cualquier cambio impacta directo la BD de producción.
3. No romper el contrato: rutas, JSON y códigos HTTP de la sección 4. Endpoint nuevo o modificado →
   actualizar esta tabla y el `Endpoints.md` del vault.
4. Autorización siempre vía `ProyectoAccesoService` dentro del service (no en el controller).
5. Controllers finos (delegan al service); validación de entrada con Bean Validation en los DTO
   `record` + `@Valid`; errores con las excepciones de cada módulo (mapeadas en `GlobalExceptionHandler`).
6. Sin N+1: consultas por proyecto + agrupación en memoria o `@EntityGraph`.
7. Inyección por constructor, sin `@Autowired` en campos. Lombok solo en `model/`.
8. Verificar con `./mvnw -q -DskipTests compile` antes de entregar. Nunca `git push`.
