# case-backend — Guía técnica (estado real del código)

API REST de la CASE Tool: usuarios + JWT, proyectos colaborativos (miembros con rol, tareas Kanban,
notas de diseño), diagramador de tablas/relaciones, exportación/importación XMI (Enterprise
Architect), DDL PostgreSQL determinístico del diagrama y chat de equipo en vivo por proyecto (STOMP sobre WebSocket,
Parcial 2 · F1) con Senior Dev IA (F2) que tiene contexto largo, herramientas de solo lectura y memoria acumulada (F3/F4). Todo lo de abajo está verificado contra el código fuente; si cambiás el código,
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

## 2. Árbol de carpetas (154 archivos `.java`: 133 en main + 21 test)

```text
case-backend/
├── pom.xml · mvnw · mvnw.cmd · .mvn/wrapper/
├── Dockerfile          # dev: compila con Maven dentro de la imagen y corre el jar (puerto 8081)
├── Dockerfile.prod     # prod: copia un target/*.jar YA compilado (deploy-aws.sh no lo compila)
├── src/main/resources/application.properties   # única configuración (static/ y templates/ vacíos)
├── src/test/java/com/casetool/backend/
│   ├── CaseBackendApplicationTests.java          # contextLoads (necesita BD)
│   ├── core/websocket/StompAuthInterceptorTest.java          # CONNECT/SUBSCRIBE/SEND (Mockito, sin BD)
│   ├── modules/chat/service/ChatMensajeServiceTest.java,     # paginación, clamp de limite, permisos, envío → evento
│   │                        ChatMensajeServiceMencionIaTest.java,  # evento con mencionaIa true/false
│   │                        ChatMensajeServiceAplicarTest.java,   # aplicar propuesta, RBAC, idempotencia y evento
│   │                        ChatMensajeBroadcastListenerTest.java, # AFTER_COMMIT: broadcast siempre, IA solo con mención
│   │                        ChatMemoriaServiceTest.java,          # memoria vacía/llena, 403, crear/actualizar, CSV herramientas
│   │                        ChatMensajeRequestValidationTest.java, # Bean Validation del body
│   │                        ChatFixtures.java                      # entidades en memoria para los tests
│   ├── modules/chat/ia/ChatMencionIaUtilsTest.java,          # regex @SeniorDev
│   │                   SeniorDevContextBuilderTest.java,     # #id [autor · ROL], aviso LECTOR, disparador fuera, hilo ↳, memoria
│   │                   SeniorDevHistorialFormatterTest.java, # recorte 600, comandos fuera, lote de resumen
│   │                   SeniorDevConversacionTest.java,       # bucle de tools: rondas, tope por turno, "none", 400 → sin tools
│   │                   SeniorDevResumidorTest.java,          # umbral 20, lote/marca, recorte 2000, error conserva resumen
│   │                   SeniorDevPromptsTest.java,            # cero SQL, comandos, GENERAR_DDL, herramientas, honestidad, permisos DDL, RESUMEN_PROMPT
│   │                   SeniorDevServiceTest.java,            # PENSANDO con detalle, herramientasUsadas, resumidor, fallback
│   │                   dto/DeepSeekMensajeJsonTest.java,     # NON_NULL y deserialización de tool_calls (Jackson 3)
│   │                   tools/SeniorDevHerramientaEjecutorTest, HerramientasProyectoTest, HerramientaBuscarHistorialTest
│   └── modules/diagrama/service/DdlPostgresServiceTest.java  # DDL: orden, NOT NULL, PK compuesta, FK, snake_case, determinismo
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
        │   │                RelacionDiagramaController, DdlController (GET /ddl text/plain)
        │   ├── dto/         DiagramaResponse, EntidadDiagramaRequest/Response, AtributoEntidadRequest/Response,
        │   │                RelacionDiagramaRequest/Response, ActualizarPuntosControlRequest, PuntoControlDto
        │   ├── exception/   NombreDuplicadoDiagramaException
        │   ├── model/       EntidadDiagrama, AtributoEntidad, RelacionDiagrama (enums Multiplicidad,
        │   │                TipoRelacionUml), PuntoControl (POJO guardado como JSON, no es @Entity)
        │   ├── repository/  EntidadDiagramaRepository, AtributoEntidadRepository, RelacionDiagramaRepository
        │   └── service/     DiagramaService, EntidadDiagramaService, AtributoEntidadService,
        │                    RelacionDiagramaService, TablaIntermediaService,
        │                    DdlPostgresService (DDL determinístico), DdlPostgresNombres (snake_case, tipos, multiplicidad)
        ├── chat/
        │   ├── controller/  ChatController
        │   ├── dto/         ChatMensajeRequest, ChatMensajeResponse (+ herramientasUsadas), ChatPresenciaResponse,
        │   │                ChatMemoriaResponse, ChatIaEstadoEvent (PENSANDO | RESPONDIDO | ERROR)
        │   ├── model/       ChatMensaje (@Entity, enum Tipo USUARIO/IA/SISTEMA, respuestaA, herramientasUsadas),
        │   │                ChatMemoria (@Entity, PK = FK proyecto, resumen + marca de agua)
        │   ├── repository/  ChatMensajeRepository (+ full-text nativo, conteo/lote para resumen), ChatMemoriaRepository
        │   ├── service/     ChatMensajeService (publica ChatMensajePublicadoEvent), ChatMensajeBroadcastListener (AFTER_COMMIT),
        │   │                ChatMemoriaService, ChatBusquedaIndiceInitializer (índice GIN), ChatPresenciaService,
        │   │                ChatPresenciaListener, ChatDestinos
        │   └── ia/          SeniorDevService (@Async orquestador), SeniorDevConversacion (bucle de tools),
        │                    SeniorDevContextBuilder, SeniorDevHistorialFormatter, SeniorDevProyectoFormatter,
        │                    SeniorDevResumidor, SeniorDevPrompts, SeniorDevLimites (todos los topes), DeepSeekClient,
        │                    ChatMencionIaUtils (@seniordev regex),
        │                    dto/ (DeepSeekMensaje, DeepSeekToolCall, DeepSeekTool, DeepSeekChatRequest, DeepSeekChatResponse),
        │                    tools/ (SeniorDevHerramientas, SeniorDevHerramientaEjecutor, HerramientasProyecto,
        │                            HerramientaBuscarHistorial)
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
- `enviar`: `strip()` del contenido (vacío → 400), `tipo=USUARIO`, `saveAndFlush` y `publishEvent(ChatMensajePublicadoEvent(resp, mencionaIa))`.
  `ChatMensajeBroadcastListener` (`@TransactionalEventListener(AFTER_COMMIT)`) recién después del commit hace
  `convertAndSend("/topic/proyectos/{id}/chat", resp)` y, si hay `@SeniorDev` (`ChatMencionIaUtils`), llama a
  `SeniorDevService.procesarMencion(resp)` (`@Async`). Así la IA siempre encuentra el disparador en BD (sin reintentos).
- `marcarPropuestaAplicada`: `POST /api/proyectos/{id}/chat/mensajes/{mId}/aplicar`. Exige rol de escritura (`ADMIN` o `COLABORADOR`; `LECTOR` da 403). Idempotente: si ya estaba aplicada (`propuesta_aplicada=true`), no sobreescribe ni falla. Persiste `propuesta_aplicada = true` y `aplicado_por = username` y publica el mismo evento con `mencionaIa=false` (broadcast AFTER_COMMIT).
- Senior Dev IA (`SeniorDevService`, F2 + F3):
  - Lock por proyecto (`ConcurrentHashMap<Long, ReentrantLock>`): las menciones se atienden en orden (cola secuencial, D6).
  - `PENSANDO` → `SeniorDevContextBuilder` → `SeniorDevConversacion.responder` → guarda `tipo=IA` con `respuestaA` y
    `herramientas_usadas` (CSV) → difunde → `RESPONDIDO` → `SeniorDevResumidor.actualizarSiCorresponde` (try/catch, D3).
  - Prompt (`system` fijo + 1 `user`, de lo estable a lo volátil): `=== MEMORIA DEL EQUIPO ===` (resumen acumulado),
    `=== ESTADO DEL PROYECTO ===` compacto (miembros; ≤ 40 tablas con columnas PK/FK; relaciones; tareas no HECHO ≤ 15
    + conteo; últimas 10 ADR con motivo ≤ 120), `=== HISTORIAL RECIENTE ===` (últimos 30 **sin el disparador**, una línea
    por mensaje `#id [user · ROL]` / `#id [Senior Dev ↳ #id]`, recorte 600, a la IA se le quitan las líneas de comandos)
    y `=== CONSULTA ACTUAL ===` con `#id [user · ROL] pregunta: …` + "Empieza tu respuesta con @user" (+ aviso si es LECTOR).
  - `SeniorDevPrompts.SYSTEM_PROMPT`: reglas F2 (cero SQL/código, Markdown, comandos `CREAR_TABLA`…`GENERAR_BACKEND`) +
    F3: identidad e hilo (abrir con `@autor`, no repetir `↳ #id`, citar `#id`), uso de herramientas (nunca inventar) y
    `GENERAR_DDL` (si piden DDL, no lo escribe: el visor lo genera). QA F3/F4: responde solo al autor de la consulta;
    **nunca afirma haber consultado** algo sin llamar la herramienta en ese turno; no confunde decisiones del chat con ADR;
    permisos reales: cualquier miembro (incl. LECTOR) ve/descarga el DDL, solo aplicar propuestas exige ADMIN/COLABORADOR.
    `RESUMEN_PROMPT` para la memoria.
  - Herramientas (tool calling, `tools/`): `obtenerDiagrama(tabla?)`, `listarTareas(estado?, asignado?)`,
    `listarNotas(texto?, limite≤20)`, `buscarEnHistorial(consulta, autor?, limite≤10)`. Solo lectura; el `proyectoId`
    NO es argumento: lo fija el servidor y se ejecutan con el `usuarioId` del autor a través de los services existentes
    (que verifican membresía con `ProyectoAccesoService`). Resultados en texto compacto, recorte 6 000; cualquier error
    → `ERROR: …` (nunca excepción). Cada ejecución se loguea con proyecto y usuario.
  - Bucle (`SeniorDevConversacion`): hasta 3 rondas con `tool_choice "auto"`, máx. 4 llamadas por ronda (las demás
    reciben `ERROR: límite…`, cada `tool_call_id` tiene su mensaje `tool`), deadline 90 s; si se agota, una llamada final
    con `tool_choice "none"`. Cada herramienta emite un `PENSANDO` con `detalle` ("Revisando el diagrama…",
    "Buscando en el historial: “…”…"). Si DeepSeek responde 400 a la 1.ª llamada con tools → una llamada sin tools (F2).
    `temperature 0.5`, `max_tokens 1200`, timeout por llamada 45 s.
  - Búsqueda full-text: consulta nativa con `to_tsvector('spanish', contenido) @@ websearch_to_tsquery('spanish', :q)`
    (nunca falla con texto libre); las palabras clave se unen con `or` (`HerramientaBuscarHistorial.alMenosUna`) porque el
    AND por defecto no encontraba nada si el modelo agregaba una palabra ausente; ordenada por `ts_rank`, excluye `SISTEMA`; usa el índice GIN `idx_chat_mensajes_fts`
    que crea `ChatBusquedaIndiceInitializer` (`CREATE INDEX IF NOT EXISTS` al arrancar; si falla solo `log.warn`).
  - Resumen acumulado (`SeniorDevResumidor`): corte = id más viejo de la ventana de 30; si hay ≥ 20 mensajes entre la
    marca y el corte, resume un lote (≤ 100, ascendente) con `RESUMEN_PROMPT` (`temperature 0.2`, `max_tokens 600`, sin
    tools), recorta a 2 000 y guarda `marca = último id del lote`. Error → conserva el resumen anterior. La memoria
    cubre solo lo que ya salió de la ventana corta (sin solapamiento).
  - Fallback: sin API key o error de DeepSeek (timeout, 401, 429) → mensaje `tipo=SISTEMA` + estado `ERROR`, sin romper la sala.
  - Todos los topes están en `SeniorDevLimites` (constantes, sin `@Value`).
- Memoria (`ChatMemoriaService`): `GET /chat/memoria` para cualquier miembro; sin fila → 200 con `resumen: null`.
- Presencia (`ChatPresenciaService`, en memoria, igual que `ColaboracionController`): cuenta una
  suscripción a `.../chat/presencia` (decisión D2: "en la sala" = tiene el proyecto abierto). Clave
  `sessionId:subscriptionId`; `ChatPresenciaListener` escucha Subscribe/Unsubscribe/Disconnect y cada
  cambio difunde la lista completa (dedupe por usuario, orden por username). Se pierde al reiniciar.
- `ChatDestinos`: arma y parsea los tópicos (mensajes `/chat`, presencia `/chat/presencia`, estado IA `/chat/ia`).

**diagrama**
- `DdlPostgresService` (`GET /ddl`, cualquier miembro): DDL PostgreSQL sin IA ni fecha → mismo diagrama, mismo texto.
  Encabezado con el nombre del proyecto; tablas en orden alfabético y columnas por id, nombres `snake_case` (misma regla
  que el generador Spring Boot; comillas solo si no es identificador simple), `VARCHAR`→`VARCHAR(255)`,
  `DECIMAL`→`NUMERIC(12,2)`, `NOT NULL` si `nullable=false`, `PRIMARY KEY (…)` (compuesta si hay varias); después las FK
  como `ALTER TABLE … ADD CONSTRAINT fk_<tabla>_<col> …` (si la referenciada no tiene PK simple, comentario) y las
  relaciones UML sin columna FK como comentario. Diagrama vacío → solo comentarios.
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
| POST | `/api/proyectos/{proyectoId}/chat/mensajes/{mensajeId}/aplicar` | Escritor (ADMIN/COLABORADOR) | 200 `ChatMensajeResponse` | Marca propuesta aplicada, persiste `propuesta_aplicada=true` y `aplicado_por=username`, difunde por WS; LECTOR da 403 |
| GET | `/api/proyectos/{proyectoId}/chat/presencia` | Miembro | 200 `ChatPresenciaResponse` | `{proyectoId, usuarios:[{usuarioId, username}]}` |
| GET | `/api/proyectos/{proyectoId}/chat/memoria` | Miembro (incl. LECTOR) | 200 `ChatMemoriaResponse` | `{proyectoId, resumen, ultimoMensajeResumidoId, updatedAt}`; sin memoria → campos null (no 404) |
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
| GET | `/api/proyectos/{proyectoId}/ddl` | Miembro (incl. LECTOR) | 200 `text/plain;charset=UTF-8` | DDL PostgreSQL determinístico; `Content-Disposition: inline; filename="esquema-{id}.sql"` |
| GET | `/api/proyectos/{proyectoId}/xmi/exportar` | Miembro | 200 XML | Descarga `diagrama-{id}.xmi` |
| POST | `/api/proyectos/{proyectoId}/xmi/previsualizar` | ADMIN | 200 `XmiPreviewResponse` | multipart, campo `archivo` |
| POST | `/api/proyectos/{proyectoId}/xmi/importar?modo=FUSIONAR\|REEMPLAZAR` | ADMIN | 200 `DiagramaResponse` | multipart `archivo`; `modo` default FUSIONAR |

Total: **42 endpoints REST** (36 previos + 5 del chat + 1 DDL; contado con `grep` de `@*Mapping`). `ChatMensajeResponse` = `{id, proyectoId, usuarioId, username, rol, tipo,
contenido, respuestaAId, createdAt, propuestaAplicada, aplicadoPor, herramientasUsadas}` (`usuarioId/username/rol` null si `tipo != USUARIO`; `rol` null si el
autor ya no es miembro; `respuestaAId` = mensaje al que responde la IA/sistema; `herramientasUsadas` = lista de
`obtenerDiagrama|listarTareas|listarNotas|buscarEnHistorial` o null si no es IA o no consultó nada).

**WebSocket (STOMP 1.2)** — `ws(s)://<host>/ws`, sin SockJS. CONNECT con header nativo
`Authorization: Bearer <jwt>`; heartbeat 10000,10000. Destinos (solo server → cliente):
`/topic/proyectos/{id}/chat` (cada mensaje, payload `ChatMensajeResponse`),
`/topic/proyectos/{id}/chat/ia` (eventos de estado IA: PENSANDO, RESPONDIDO, ERROR, payload `ChatIaEstadoEvent`; en F3 llegan
**varios** `PENSANDO` por respuesta, uno por herramienta, con `detalle` distinto), y
`/topic/proyectos/{id}/chat/presencia` (al entrar/salir alguien, payload `ChatPresenciaResponse`, lista
completa). Errores: frame `ERROR` con `message` `401 …` / `403 …` y cierre. En Nginx (`case-frontend/nginx*.conf`)
`location = /ws` con `Upgrade`/`Connection: upgrade` y timeouts de 3600 s.

Detalle: en las rutas anidadas (`/tareas/{tareaId}`, `/entidades/{entidadId}/atributos/{atributoId}`,
`/relaciones/{relacionId}`) el permiso se valida contra el proyecto real del recurso; el
`{proyectoId}`/`{entidadId}` del path no se cruza con el recurso.

Errores (`GlobalExceptionHandler`): 400 validación (`campo: mensaje; ...`) o `IllegalArgumentException`;
401 sin token / credenciales malas; 403 no miembro o rol insuficiente; 404 recurso inexistente;
409 nombre/usuario duplicado o violación de integridad en BD.

## 5. Modelo de datos (10 tablas, Hibernate `ddl-auto=update`, sin migraciones)

| Tabla | Columnas clave | Restricciones |
| :--- | :--- | :--- |
| `usuarios` | `id`, `username`(50), `email`(100), `password`(255, hash BCrypt), `created_at` | `username` y `email` únicos |
| `proyectos` | `id`, `nombre`(100), `descripcion` TEXT, `created_at` | |
| `miembros_proyecto` | `id`, `proyecto_id`, `usuario_id`, `rol`(20: ADMIN/COLABORADOR/LECTOR), `created_at` | único (`proyecto_id`,`usuario_id`); `proyecto_id` ON DELETE CASCADE |
| `tareas_proyecto` | `id`, `proyecto_id`, `usuario_id` (asignado, nullable), `titulo`(150), `descripcion` TEXT, `prioridad`(20), `estado`(20), `created_at` | `proyecto_id` CASCADE |
| `notas_proyecto` | `id`, `proyecto_id`, `usuario_id` (autor), `accion`(100), `motivo` TEXT, `created_at` | `proyecto_id` CASCADE |
| `diagrama_entidades` | `id`, `proyecto_id`, `nombre`(100), `pos_x`, `pos_y`, `created_at` | único (`proyecto_id`,`nombre`); CASCADE |
| `entidad_atributos` | `id`, `entidad_id`, `nombre`(100), `tipo_sql`(50), `es_pk`, `es_fk`, `referencia_entidad_id` (nullable), `nullable`, `created_at` | único (`entidad_id`,`nombre`); `entidad_id` CASCADE; `referencia_entidad_id` **RESTRICT a propósito** |
| `chat_mensajes` | `id`, `proyecto_id`, `usuario_id` (nullable: null = IA/SISTEMA), `tipo`(20: USUARIO/IA/SISTEMA), `contenido` TEXT, `respuesta_a_id` (nullable, FK a sí misma), `created_at`, `propuesta_aplicada` (NOT NULL default false), `aplicado_por`(100), `herramientas_usadas`(255, nullable, CSV) | `proyecto_id` CASCADE; `respuesta_a_id` SET NULL; índice `idx_chat_mensajes_proyecto_created` (`proyecto_id`,`created_at`); índice GIN `idx_chat_mensajes_fts` sobre `to_tsvector('spanish', contenido)` (lo crea `ChatBusquedaIndiceInitializer`, Hibernate lo ignora); CHECK de `tipo` (agregar un valor exige `ALTER TABLE` manual) |
| `chat_memoria` | `proyecto_id` (PK y FK), `resumen` TEXT, `ultimo_mensaje_resumido_id` (marca de agua, sin FK), `updated_at` | `proyecto_id` ON DELETE CASCADE (verificado con `\d chat_memoria`) |
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
| `deepseek.api.key` | `DEEPSEEK_API_KEY` | vacío → Senior Dev responde con mensaje `SISTEMA` "Clave de API no configurada" (fuera de Docker la toma del `.env` raíz) |
| `deepseek.api.url` / `deepseek.model` | `DEEPSEEK_API_URL` / `DEEPSEEK_MODEL` | `https://api.deepseek.com` / `deepseek-chat` |
| `deepseek.timeout-ms` | `DEEPSEEK_TIMEOUT_MS` | `45000` por llamada (el bucle de herramientas tiene además un deadline de 90 s en `SeniorDevLimites`) |

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
./mvnw -q test -Dtest='Chat*Test,SeniorDev*Test,Herramienta*Test,DeepSeek*Test,Ddl*Test,Stomp*Test'   # unitarios sin BD (97)
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
