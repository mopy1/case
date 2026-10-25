# case-frontend — Guía técnica (estado real del código)

SPA del CASE Tool: modelado UML/ER colaborativo, Kanban, notas ADR, XMI, generador Spring Boot, chat grupal del equipo (STOMP) y
Copilot IA. Producción: https://casetool-sw.duckdns.org (misma origin que la API, vía Nginx).

## 1. Stack (versiones instaladas)

| Pieza | Paquete | Versión |
| --- | --- | --- |
| UI | `react`, `react-dom` | 19.2 |
| Lenguaje | `typescript` (strict por defecto de TS 6; `tsconfig.app.json` no lo declara) | 6.0 |
| Bundler | `vite` + `@vitejs/plugin-react` | 8.2 |
| Estilos | `tailwindcss` v4 (`@tailwindcss/vite`), `tw-animate-css`, `shadcn/tailwind.css` | 4.3 |
| Componentes | shadcn estilo `base-luma` sobre `@base-ui/react` (no Radix) | 1.8 |
| `cn()` | paquete `cn` (reemplazo de clsx + tailwind-merge; `lib/utils.ts` lo re-exporta) | 0.2 |
| Lienzo | `@xyflow/react` (React Flow) | 12.11 |
| Rutas | `react-router-dom` | 7.18 |
| Tiempo real (chat) | `@stomp/stompjs` (STOMP 1.2 sobre WebSocket nativo, sin SockJS) | 7.3 |
| ZIP | `jszip` + `file-saver` | — |
| Iconos / fuente | `lucide-react`, `@fontsource-variable/inter` | — |
| Lint | `oxlint` (`.oxlintrc.json`: plugins react, typescript, oxc) | 1.79 |

Alias `@/` → `src/` (vite.config.ts y tsconfig.app.json).

## 2. Árbol de `src/` (verificado con `find`)

```text
src/
├── main.tsx                  # StrictMode > BrowserRouter > ThemeProvider > ErrorBoundary > App
├── App.tsx                   # Rutas + React.lazy por página + TooltipProvider
├── index.css                 # Tailwind v4, tokens OKLCH (claro/.dark), vars --visual-viewport-height/--keyboard-height
├── components/
│   ├── ui/                   # Primitivas shadcn (generadas): alert avatar badge button card checkbox dialog
│   │                         #   dropdown-menu empty field input label select separator skeleton tabs textarea tooltip
│   └── common/
│       ├── ConfirmDialog.tsx       # Diálogo "¿Eliminar…?" reutilizado por todos los borrados
│       ├── ErrorBoundary.tsx       # Error de render recuperable; se resetea con `resetKey` (ruta)
│       ├── ThemeToggle.tsx         # Botón claro/oscuro
│       ├── UserAvatarMenu.tsx      # Menú de usuario: tema + cerrar sesión
│       └── project-nav-rail/       # Riel lateral del proyecto (index.ts, project-nav-rail.tsx, .data.ts)
├── contexts/ThemeContext.tsx # Tema "dark"|"light" en localStorage `casetool_theme` (index.html lo aplica antes de montar)
├── hooks/
│   ├── useAuth.ts            # Lee `user` de localStorage; `logout()` borra token+user (no llama al backend)
│   └── useIsMobile.ts        # matchMedia < 768px
├── layouts/ProjectLayout.tsx # Shell de /proyectos/:id (ver §4)
├── lib/
│   ├── api.ts                # apiFetch, API_URL, parseErrorMessage, mensajeDeError
│   ├── avatar.ts             # colorAvatar(id), iniciales(username)
│   ├── descargarArchivo.ts   # descargarBlob(blob, nombre) — <a download> sintético
│   ├── projectCode.ts        # encode/decodeProjectId: id numérico <-> "prj-xxxx" (afín mod 2^32, reversible)
│   └── utils.ts              # export { cn } from "cn"
├── routes/
│   ├── ProtectedRoute.tsx    # Sin token en localStorage → /login
│   └── GuestRoute.tsx        # Con token → /proyectos
└── features/                 # auth, projects, diagram, tasks, notes, xmi, generator, copilot, chat, collaboration, voice
    └── chat/                 # Chat grupal del equipo con Senior Dev IA y mejoras F2+ (ver §6 chat)
        ├── index.ts          # export { ChatTeamView } + tipos
        ├── types/
        │   ├── chat.types.ts          # ChatMensaje, ChatPresencia, UsuarioEnSala, EstadoConexionChat, ChatIaEstado, ChatIaEstadoEvent
        │   ├── chat-proposal.types.ts # ChatProposal, ChatProposalSummary, PermisosPropuesta, evaluarPermisosPropuesta
        │   ├── mention.types.ts       # MentionItem, MentionTriggerState
        │   └── markdown.types.ts      # MarkdownBlock, MarkdownBlockType, MarkdownInlineToken
        ├── api/chatApi.ts             # listarMensajes, enviarMensaje, obtenerPresencia (apiFetch)
        ├── lib/
        │   ├── chatSocket.ts          # chatWsUrl() y chatTopics(p) (mensajes, presencia, ia)
        │   ├── chatFormat.ts          # unirMensajes (dedupe por id), horaCorta, etiquetaRol, nombreAutor
        │   ├── chatProposalParser.ts  # Parser puro de comandos Senior Dev y extracción de texto conceptual limpio
        │   ├── chatProposalStorage.ts # Persistencia en localStorage de propuestas aplicadas por proyecto
        │   ├── markdownBlockTokenizer.ts # AST de bloques Markdown (code, heading, blockquote, lists, paragraph)
        │   └── markdownInline.tsx     # Inline Markdown (bold, italic, inline code, @menciones)
        ├── hooks/
        │   ├── useChatMensajes.ts          # Historial + envío REST
        │   ├── useChatSocket.ts            # STOMP multicanal
        │   ├── useChatSala.ts              # Orquesta presencia + IA
        │   ├── useChatProposalExecutor.ts  # Ejecución de propuestas en lote, toast feedback y estado reactivo
        │   ├── useMentionTrigger.ts        # Detección de @query, filtrado y navegación de teclado (flechas/Enter/Tab/Esc)
        │   └── useChatVoiceInput.ts        # Integración con Web Speech API sin sobrescribir texto previo
        └── components/
            ├── chat-team-view.tsx            # Contenedor principal con candidatos de mención, miRol y layout
            ├── chat-presence-bar.tsx         # Barra de presencia y estado WS
            ├── chat-message-list.tsx         # Scroll virtual/automático y propagación de miRol / proyectoId
            ├── chat-message-item.tsx         # Mensaje con avatar, roles, texto limpio y tarjeta de propuesta
            ├── chat-proposal-card.tsx        # Tarjeta contenedora interactiva de propuesta de arquitectura
            ├── chat-proposal-summary.tsx     # Badges/chips de cambios proyectados (tablas, atributos, relaciones, ADRs)
            ├── chat-proposal-action-button.tsx # Botón de aplicación con RBAC (ADMIN/COLABORADOR vs LECTOR)
            ├── chat-message-content.tsx      # AST tokenizado a ChatMarkdownRenderer
            ├── chat-markdown-renderer.tsx    # Renderizado estructurado de bloques Markdown
            ├── chat-code-block.tsx           # Bloque de código con header de lenguaje y botón "Copiar" (2s feedback)
            ├── chat-quoted-message.tsx       # Cita visual al mensaje referenciado
            ├── chat-thinking-indicator.tsx   # Indicador animado de pensamiento del Senior Dev
            ├── chat-input.tsx                # Input con autocompletado @, botón +@SeniorDev, voz y hotkeys
            ├── chat-mention-popover.tsx      # Popover flotante con sugerencias de mención
            ├── chat-mention-item.tsx         # Renglón de sugerencia (avatar, username, rol/IA)
            ├── chat-voice-button.tsx         # Botón de micrófono con estado pulsante y tooltip
            ├── chat-empty-state.tsx          # Estado inicial accionable
            └── chat-skeleton.tsx             # Skeleton de carga
```

Convención por feature: `api/` (llamadas HTTP), `hooks/` (estado + mutaciones), `components/`,
`lib/` (lógica pura), `pages/` (página delgada), `types/`.

## 3. Enrutamiento (`App.tsx`)

| Ruta | Guarda | Elemento |
| --- | --- | --- |
| `/` y `*` | — | Redirige a `/proyectos` o `/login` según haya `token` |
| `/login`, `/register` | GuestRoute | LoginPage, RegisterPage |
| `/proyectos` | ProtectedRoute | ProjectsDashboardPage |
| `/proyectos/:id` | ProtectedRoute | ProjectLayout; index → `diagrama` |
| `/proyectos/:id/{diagrama,tareas,notas,xmi,generador}` | ProtectedRoute | DiagramEditorPage, ProjectTasksPage, ProjectNotesPage, ProjectXmiPage, ProjectGeneratorPage |

`:id` es el código ofuscado `prj-…`; un id numérico también se acepta y `ProjectLayout` reescribe la
URL al código. Todas las páginas se cargan con `React.lazy` + `Suspense`.

## 4. Layout del proyecto (`layouts/ProjectLayout.tsx`)

- `ProjectNavRail` (izquierda): volver, 5 secciones (`project-nav-rail.data.ts`), diálogo de
  colaboradores (`ProjectMembersDialog`), avatares de miembros, tema y menú de usuario.
- `<main>`: `<Outlet/>` dentro de `ErrorBoundary resetKey={pathname}`; si `getProject` falla muestra Alert.
- `CopilotPanel` (derecha): shell (backdrop móvil, `<aside>`, resize) con **dos pestañas** (`copilot-panel-tabs.tsx`,
  `Tabs` de Base UI, ambas `keepMounted`): **Equipo** (`teamPanel` = `<ChatTeamView key={proyectoId} />`) y
  **Copilot** (`copilot-assistant-view.tsx`, el asistente de siempre). Pestaña activa en localStorage
  `sw_case_panel_tab` (`equipo` por defecto, `usePanelTab`); el evento `copilot:voice-submit` salta a "Copilot".
  El cierre `X` vive en la fila de pestañas (`CopilotHeader.onClose` es opcional). Como el `<aside>` siempre
  está montado, el WebSocket del chat vive mientras el usuario está dentro del proyecto ("en la sala" =
  proyecto abierto), aunque el panel esté cerrado o en la otra pestaña. Abierto/cerrado en localStorage `sw_case_copilot_open` (solo escritorio).
  Escritorio (>= 768px): acoplado y redimensionable 280–720px (`usePanelResize`, localStorage
  `sw_case_copilot_width`, doble clic resetea a 350). Móvil: inicia cerrado; drawer `fixed` con backdrop.
- **Modo Pantalla Completa del Chat / Copilot (`isChatFullScreen`):** botón en la barra superior de pestañas (`copilot-panel-tabs.tsx`, icono `Maximize2` / `Minimize2`). Al activarse, oculta el `<main>` central (`hidden`) y expande el panel lateral al 100% del ancho disponible, manteniendo visible únicamente el `ProjectNavRail` a la izquierda. Se restaura con el botón de minimizar o presionando la tecla `Escape`.
- `usePushToTalk` + `VoicePushToTalkHud`: el texto dictado se envía al Copilot con el evento de
  ventana `copilot:voice-submit`.

## 5. Cliente HTTP (`lib/api.ts`)

- `API_URL = import.meta.env.VITE_API_URL ?? ""`. Vacío en producción → rutas relativas `/api/...`.
- `apiFetch<T>(path, { errorFallback, raw, ...RequestInit })`: agrega `Authorization: Bearer <token>`
  (localStorage `token`), `Content-Type: application/json` si hay body y no es `FormData`.
  401 → borra `token`/`user` y redirige a `/login`. Error → `Error(body.message ?? errorFallback)`.
  204 → `undefined`. `raw: true` devuelve el `Response` (descarga de XMI).
- `mensajeDeError(err, fallback?)`: texto para `setError` en los `catch` (fallback por defecto
  "No se pudo conectar con el servidor").
- `features/auth/api/authApi.ts` usa `fetch` directo (sin token ni manejo de 401).

## 6. Features

Endpoints relativos a `/api`. `{p}` = id numérico del proyecto (decodificado de la URL).

### auth
- `useLogin` / `useRegister`: `POST /auth/login` (`{usernameOrEmail, password}`) y `POST /auth/register`
  (`{username, email, password}`) → guardan `token` y `user {id, username, email}` en localStorage y navegan a `/`.
- Textos de formularios en `*.data.ts`.

### projects
- `useProjects` → `GET /proyectos` (lista con `miRol`). Dashboard con búsqueda en memoria por nombre.
- `useProject(id)` → `GET /proyectos/{id}`. `useProjectMutations` → `POST /proyectos`, `PUT /proyectos/{id}`, `DELETE /proyectos/{id}`.
- `useProjectMembers` → `GET /proyectos/{p}/miembros`. `useMemberMutations` → `POST /proyectos/{p}/miembros`
  (`{usernameOrEmail, rol}`), `PATCH .../miembros/{usuarioId}/rol` (`{rol}`), `DELETE .../miembros/{usuarioId}`.
- Roles `ADMIN | COLABORADOR | LECTOR`. Editar/eliminar proyecto y gestionar miembros solo se muestra a ADMIN.

### diagram (React Flow)
- `useDiagram` → `GET /proyectos/{p}/diagrama` (`{entidades, relaciones}`). `loading` solo en la carga
  inicial; `refetch()` actualiza en silencio. Escucha el evento `project:diagram-updated`.
- `useDiagramCanvas`: orquesta nodos/aristas (`diagramMappers.ts`), selección y mutaciones;
  `useDiagramEntityActions` (crear en posición libre, mover al soltar, renombrar, borrar).
- Mutaciones (`diagramApi.ts`): entidades `POST/PUT/DELETE /proyectos/{p}/entidades[/{id}]`; atributos
  `POST/PUT/DELETE /proyectos/{p}/entidades/{e}/atributos[/{id}]`; relaciones `POST/PUT/DELETE
  /proyectos/{p}/relaciones[/{id}]`; puntos de control `PATCH /proyectos/{p}/relaciones/{id}/puntos` (`{puntos}`).
- Relación: `multiplicidadOrigen/Destino` ∈ `UNO | CERO_O_UNO | UNO_O_MAS | CERO_O_MAS`, `tipo` ∈
  `ASOCIACION | COMPOSICION | AGREGACION | HERENCIA`. Conectar dos tablas crea `UNO`–`UNO` ASOCIACION.
- Tablas: nodos `deletable: false` (se borran solo con el botón y confirmación). Relaciones: se borran
  con Supr/Backspace o desde su toolbar.
- `lib/`: `floatingEdge.ts` (punto de salida sobre el borde de cada tabla), `relationPath.ts` (trazado
  con quiebres y puntos de control), `controlPoints.ts`, `relacionesDerivadas.ts` (detecta tabla
  intermedia N:M → `AssociationClassOverlay`; offsets de relaciones paralelas), `relationCrossing.ts`
  (muestrea los `<path>` del DOM y dibuja "saltos" en cruces), `positionGuide.ts` (grilla anti-colisión
  de 3 columnas, también usada por el Copilot), `multiplicidad.ts`, `relationStyle.ts`.
- `usePuntosControlArrastre`: Ctrl+arrastrar la línea agrega punto, arrastrar lo mueve, Ctrl+click lo
  quita; estado local hasta soltar, luego persiste.
- Panel de propiedades: renombrar tabla y CRUD de atributos (`AttributeFormDialog` + `useAttributeForm`).

### tasks
- `useTasks` → `GET /proyectos/{p}/tareas`; escucha `project:task-created|updated|deleted`.
- `useTaskMutations` → `POST /proyectos/{p}/tareas` (`{titulo, descripcion, prioridad, usuarioId}`),
  `PATCH .../tareas/{id}/estado` (`{estado}`), `DELETE .../tareas/{id}`; emite los eventos anteriores.
- Kanban de 3 columnas: `PENDIENTE` (Pendiente), `EN_PROGRESO` (En progreso), `HECHO` (Hecho); se
  avanza/retrocede con flechas. Prioridad `ALTA | MEDIA | BAJA`.

### notes
- `useNotes` → `GET /proyectos/{p}/notas`; escucha `project:note-created`. `useNoteMutations` →
  `POST /proyectos/{p}/notas` (`{accion, motivo}`). Solo alta y lectura (sin editar/borrar en la UI).

### xmi
- `useXmiExchange`: exportar `GET /proyectos/{p}/xmi/exportar` (blob → `proyecto-{p}.xmi`); importar en
  dos pasos: `POST .../xmi/previsualizar` (multipart `archivo`) y `POST .../xmi/importar?modo=FUSIONAR|REEMPLAZAR`,
  luego navega a `diagrama`. El botón Importar solo se muestra a ADMIN.

### generator (100% en el cliente)
- `useProjectGenerator`: `GET` diagrama + proyecto → `generarProyectoSpringBoot(nombre, diagrama)` →
  vista previa (árbol + visor) → `descargarProyectoZip` (JSZip, `mvnw` con permisos 755, `backend-{p}.zip`).
- `lib/springBootGenerator.ts` orquesta; plantillas en `lib/springboot/`: `nombres.ts` (casing, tipos
  SQL→Java, `BASE_PACKAGE com.casetool.generated`), `entidadJpa.ts` (normaliza PK), `relacionesJpa.ts`
  (@ManyToOne/@OneToMany desde FKs y relaciones), `pomXml.ts`, `archivosConfig.ts`, `archivosCore.ts`,
  `capaModelo|capaRepositorio|capaDto|capaServicio|capaControlador.ts`. Maven Wrapper desde
  `templates/*.template` (`?raw`, `mavenWrapperLoader.ts`).

### copilot
- `useCopilot(proyectoId)`: historial en memoria (se pierde al recargar), sección activa según la URL,
  "Modo Autónomo" (localStorage `sw_case_copilot_auto_mode`: aplica todas las sugerencias sin clic).
- Flujo de `sendMessage(texto, imagen?)`: `GET` diagrama → `askCopilot` (`lib/geminiService.ts`):
  1. Con imagen → Gemini Vision (`geminiVisionService.ts`), modelos en orden `gemini-3.5-flash-lite`,
     `gemini-3.5-flash`, `gemini-2.0-flash`; clave `VITE_GEMINI_API_KEY` en la query `?key=`.
  2. Solo texto → DeepSeek `https://api.deepseek.com/chat/completions`, modelo `deepseek-chat`,
     temperature 0.3, system prompt de `copilotSystemPrompt.ts` (tablas/relaciones actuales + sintaxis
     de comandos); clave `VITE_DEEPSEEK_API_KEY` (también acepta la variante mal escrita `VITE_DEEPSEEk_API_KEY`).
  3. Sin clave o si DeepSeek falla → respuesta local por palabras clave (`copilotKnowledge*.ts`).
- Las llamadas a DeepSeek/Gemini salen **directo del navegador**; las claves `VITE_*` quedan embebidas
  en el bundle JS (ver §8).
- La respuesta se parsea a sugerencias (`copilotParsers.ts` → `copilotDiagramParsers.ts`,
  `copilotUmlParsers.ts`, `copilotSystemParsers.ts`): `CREAR_TABLA`/`ATRIBUTOS`, `CREAR_RELACION`,
  `AGREGAR_ATRIBUTO`, `ELIMINAR_TABLA` (solo si el usuario pidió borrar), `ELIMINAR_RELACION`,
  `CREAR_TAREA`, `ADR_SUGERIDA`/`MOTIVO`, `EXPORTAR_XMI`, `GENERAR_BACKEND`, `IR_A`. Cada una se
  muestra como tarjeta aplicable (`copilot-*-card.tsx`) o en lote ("Aplicar todos", `copilotBatchExecutor.ts`).
- Las acciones (`copilotDiagramActions.ts`, `copilotSystemActions.ts`) usan las mismas APIs de las
  features (diagrama, tareas, notas, xmi, generador) y emiten `project:*` para refrescar las vistas.
- Entrada: texto, dictado (`useSpeechRecognition`, comandos de voz "enviar"/"detener") y foto
  (`copilotImageUtils.ts`: redimensiona a 1200px, JPEG 0.8, base64).

### chat (pestaña "Equipo" del panel lateral, con Senior Dev IA en tiempo real)
- REST (`chatApi.ts`): `GET /proyectos/{p}/chat/mensajes?limite=30[&antesDe={id}]` (orden ascendente;
  `hayMas = length === 30`), `POST /proyectos/{p}/chat/mensajes` (`{contenido}` ≤ 4000) → `ChatMensaje`,
  `GET /proyectos/{p}/chat/presencia` → `{proyectoId, usuarios: [{usuarioId, username}]}`. Cualquier miembro
  (incluido LECTOR) lee y escribe.
- WebSocket (`useChatSocket`): `Client` de `@stomp/stompjs` contra `chatWsUrl()` =
  `(VITE_API_URL || origin)` con `http→ws` + `/ws`; `reconnectDelay` 5s, heartbeat 10s/10s. `beforeConnect`
  manda `Authorization: Bearer <token>` (el vigente en localStorage; sin token → estado `error`). Se suscribe a:
  1. `/topic/proyectos/{p}/chat`: difusión de mensajes guardados (`USUARIO`, `IA` o `SISTEMA`).
  2. `/topic/proyectos/{p}/chat/presencia`: snapshot de usuarios presentes (suscripción que marca "en la sala").
  3. `/topic/proyectos/{p}/chat/ia`: eventos efímeros `ChatIaEstadoEvent` (`PENSANDO`, `RESPONDIDO`, `ERROR`).
  Frame ERROR con `401`/`403` → `deactivate()` y "Sin tiempo real" (sin bucle de reconexión); corte de red → "Reconectando…".
- `useChatSala`: en cada `onConnect` pide `GET .../presencia` (snapshot); si el historial había fallado (backend caído al
  entrar) hace `recargar()` solo, y si es reconexión `sincronizar()` (GET últimos + unión) para recuperar lo perdido. El propio usuario se agrega a "en la sala" si está conectado.
  El emisor recibe su mensaje por REST y por WS: `unirMensajes` deduplica por `id`. Maneja el estado `iaPensando` ante eventos de IA.
- UI y Componentes F2 y F2+ (Mejoras avanzadas de Chat Grupal):
  - **Menciones dinámicas con `@` estilo WhatsApp/Slack (`useMentionTrigger`, `ChatMentionPopover`, `ChatMentionItem`):**
    Detecta `@query` en tiempo real desde el cursor; abre un popover accesible sobre el input con filtrado instantáneo por coincidencia insensible a mayúsculas/minúsculas. Incluye tanto al bot `@SeniorDev` (con icono de bot y badge IA) como a los miembros reales del proyecto cargados con `useProjectMembers` (con sus avatares, usernames y badges de rol). Soporta navegación fluida por teclado (`ArrowDown`/`ArrowUp` para navegar, `Enter`/`Tab` para insertar, `Escape` para cancelar) e inserción precisa con reposicionamiento de foco y cursor.
  - **Renderizado Markdown estructurado y limpio (`markdownBlockTokenizer`, `markdownInline`, `ChatMarkdownRenderer`, `ChatCodeBlock`):**
    Parser AST y renderer modular sin dependencias externas pesadas. Tokeniza texto en bloques (`code_block`, `heading` h1-h6, `blockquote`, `bullet_list`, `ordered_list`, `paragraph`) y tokens inline (negrita `**`, cursiva `*`, código inline `` `code` ``, mención resaltada `@SeniorDev` con icono Sparkles y `@usuario`). Los bloques de código (`ChatCodeBlock`) cuentan con cabecera de lenguaje monospace y botón de copia al portapapeles (`navigator.clipboard`) con feedback visual de confirmación de 2 segundos.
  - **Transcripción por voz integrada en el chat (`useChatVoiceInput`, `ChatVoiceButton`):**
    Usa la Web Speech API (`webkitSpeechRecognition`/`SpeechRecognition`, `es-ES`) mediante un buffer acumulativo persistente (`baseTextRef`) que permite añadir texto dictado sin sobrescribir lo que el usuario ya había escrito. El botón `ChatVoiceButton` conmuta entre reposo y grabación continua (`animate-pulse` con indicador `animate-ping` y etiqueta "Escuchando…"), deteniéndose automáticamente al enviar el mensaje.
  - **Modo Pantalla Completa:**
    Controlado desde `ProjectLayout.tsx` (`isChatFullScreen`) y conmutado desde `CopilotPanelTabs`, permite expandir el chat grupal para lectura cómoda de código largo o discusiones complejas, ocultando el centro y dejando visible el riel lateral de navegación (`ProjectNavRail`). Se cancela con el botón de restaurar o la tecla `Escape`.
  - **Tarjetas de Propuestas Interactivas y RBAC (`ChatProposalCard`, `ChatProposalSummary`, `ChatProposalActionButton`, `useChatProposalExecutor`, `chatProposalParser`, `chatProposalStorage`):**
    Senior Dev responde con análisis conceptual en prosa limpia y emite comandos estructurados al final. El cliente procesa el mensaje con `parseChatProposal`, limpiando el texto del cuerpo visible y generando una tarjeta `ChatProposalCard` si hay cambios detectados (tablas nuevas, atributos, relaciones UML, tareas Kanban o notas ADR).
    - **Permisos de colaboración (RBAC):** `evaluarPermisosPropuesta(miRol)` valida si el usuario es `ADMIN` o `COLABORADOR` para habilitar el botón "⚡ Aplicar cambios en el proyecto". Si el usuario es `LECTOR`, el botón se deshabilita con cursor bloqueado y leyenda explicativa ("🔒 Solo ADMIN y COLABORADOR pueden aplicar cambios al proyecto.").
    - **Ejecución y Persistencia:** Al presionar aplicar, `useChatProposalExecutor` ejecuta `executeAllMessageChanges`, emite notificaciones Toast (`sonner`), conmuta el estado visual a "✓ Cambios aplicados en el proyecto" y persiste los IDs aplicados en `localStorage` (`swcase_applied_proposals_<proyectoId>`) para idempotencia y recargas fluidas.
  - `ChatThinkingIndicator`: burbuja animada con icono de bot y tres puntos pulsantes cuando Senior Dev está procesando una consulta.
  - `ChatQuotedMessage`: cita visual del mensaje original al que responde el Senior Dev (`respuestaAId`), mostrando autor y extracto del contenido.
  - `ChatMessageItem`: estilos diferenciados por rol/tipo (`USUARIO`, `IA` con badge "Senior Dev" / fondo tintado sutil, o `SISTEMA` centrado).
  - `ChatInput`: integra el botón de atajo rápido `+ @SeniorDev`, el botón de dictado por voz `ChatVoiceButton`, el popover de menciones y atajos de teclado (`Enter` para enviar / `Shift+Enter` para salto de línea).
  - Barra de presencia (`AvatarGroup` máx. 4 + "+N", badge emerald/ámbar/rose de conexión), 4 estados (skeleton · Alert + "Reintentar" · vacío con "Saludar al equipo" o consultar al Senior Dev · lista).

### collaboration (solo en DiagramEditorPage)
- `useRealtimeCollaboration(p)` combina tres mecanismos:
  1. `BroadcastChannel("sw-case-collab-{p}")`: pestañas del mismo navegador; cursor cada >= 40ms,
     ping `USER_JOIN` cada 3s, `USER_LEAVE` al desmontar.
  2. `useHttpPresence`: `POST /proyectos/{p}/colaboracion/presencia` (`{clientId, username, color, cursor}`
     → lista de presentes) cada 800ms y al mover el cursor (throttle 250ms);
     `POST .../colaboracion/desconectar` (`{clientId}`) al desmontar y en `beforeunload`.
  3. `useDiagramPolling`: `GET` diagrama cada 7s; si el JSON cambió emite `project:diagram-updated`.
- `clientId` estable por pestaña en sessionStorage (`sw_case_client_id_{userId}`); color derivado del username.
- UI: `CollaboratorPresenceBar` (avatares) y `RemoteCursorsLayer` (coordenadas relativas al contenedor, no al viewport del lienzo).

### voice
- `useSpeechRecognition`: Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`), `es-ES`.
- `usePushToTalk`: mantener Espacio o V (fuera de inputs) o Ctrl+Espacio/Alt+V (dentro de inputs);
  al soltar envía el texto (sin la palabra final "enviar/detener") y muestra el HUD.

## 7. Eventos de ventana (comunicación entre features)

| Evento | Emisor | Oyente |
| --- | --- | --- |
| `project:diagram-updated` `{proyectoId}` | acciones del Copilot, `useDiagramPolling` | `useDiagram` (refetch) |
| `project:task-created/updated/deleted` | `useTaskMutations`, Copilot | `useTasks` |
| `project:note-created` | Copilot | `useNotes` |
| `copilot:voice-submit` `{text}` | `ProjectLayout` (push-to-talk) | `CopilotAssistantView` (envía) y `usePanelTab` (cambia a la pestaña Copilot) |

## 8. Variables de entorno (Vite, se hornean en el build)

| Variable | Uso | Dev (`.env`) | Prod (`.env.production`) |
| --- | --- | --- | --- |
| `VITE_API_URL` | Prefijo de la API y base del WebSocket del chat (`ws://…/ws`; vacío → `wss://<origin>/ws`) | `http://localhost:8081` | vacío (rutas relativas por Nginx) |
| `VITE_DEEPSEEK_API_KEY` | Copilot texto | clave | clave |
| `VITE_GEMINI_API_KEY` | Copilot visión | clave | clave |

Plantillas versionadas: `.env.example`, `.env.production.example`. `.env` y `.env.production` están
en `.gitignore`. Toda variable `VITE_*` es pública: aparece en `dist/assets/*.js`.

## 9. Build y despliegue

- `npm run dev` (Vite :5173) · `npm run build` (`tsc -b && vite build`) · `npm run lint` (oxlint) · `npm run preview`.
- `.dockerignore`: solo excluye `node_modules` y `.git`. El `.env` entra **a propósito** para que la imagen
  dev compile con las claves y el Copilot use IA real en local (quedan visibles en el bundle, igual que en prod).
- `Dockerfile` (dev, `docker-compose.yml` → `case_frontend` en :5173→80): build con Node 22 dentro de
  la imagen + `nginx.dev.conf` (HTTP; `/api/` → `http://backend-app:8081/api/`; SPA con `try_files`).
- `Dockerfile.prod` (`docker-compose.prod.yml`): **copia `dist/` ya compilado** (hay que correr
  `npm run build` con `.env.production` antes) + `nginx.conf` (80 → 301 HTTPS; 443 con certificados
  Let's Encrypt montados desde `/etc/letsencrypt`; `/api/` → `backend-app:8081`).
- `deploy-aws.sh` (raíz): instala Docker si falta, crea swap y ejecuta `docker compose -f docker-compose.prod.yml up -d --build`.

## 10. Reglas para agentes

1. Ningún archivo de código > 150 líneas (componentes idealmente < 120). Excepciones actuales:
   `components/ui/{select,field,dropdown-menu}.tsx` (generados por shadcn; `ui/tabs.tsx` también trae el warning `only-export-components` de `tabsListVariants`, igual que `button`/`badge`) y
   `generator/lib/springboot/{relacionesJpa,capaServicio}.ts` (pendientes de dividir).
2. Páginas delgadas: la lógica va en hooks/lib; HTTP siempre vía `apiFetch` (salvo auth).
3. No cambiar contratos con el backend (paths, DTOs, enums) sin cambiar el backend y su `Endpoints.md`.
4. `catch (err)` + `mensajeDeError(err)`; no usar `any`.
5. Primitivas UI: shadcn sobre Base UI (`npx shadcn add <x>`), no Radix.
6. Verificar con `npm run build` (0 errores) y `npm run lint`.
7. Nunca `git push`.
