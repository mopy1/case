# CASE Frontend — Arquitectura, Guía de Diseño y Árbol Proyectado

Este documento define la arquitectura técnica, los patrones de diseño y la estructura completa de carpetas de `case-frontend` para el desarrollo del proyecto **CASE Tool** (Ingeniería de Software). Es la fuente de verdad exclusiva del frontend — el `AGENTS.md` de la raíz del repo solo enlaza para acá.

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas directrices de forma obligatoria.

## ✅ Estado real construido (2026-09-07/08)

El árbol de la sección 2 de abajo es el **proyectado** (plan completo). Lo que existe de verdad
hoy, funcional y probado contra el backend real:

- `pages/Home.tsx`, `features/auth/` completo (login/register).
- `features/projects/` — dashboard de proyectos completo: listar, buscar, crear (`Dialog` real),
  tarjetas con avatares de colaboradores reales (`useProjectMembers`, un fetch por tarjeta — ver
  nota de escalabilidad en la sección de `projects` más abajo).
- **`layouts/ProjectLayout.tsx`** (nuevo) + **`components/common/project-nav-rail/`** (nuevo) —
  el riel de navegación con Volver/Diagrama(deshabilitado)/Tareas/Notas/XMI/Generador. **Sin barra
  superior** (2026-09-08, pedido explícito: "no quiero una barra en la parte de arriba") — el
  breadcrumb del proyecto se sacó y los avatares (colaboradores + usuario actual) se movieron al
  **riel izquierdo**, apilados verticalmente al fondo del riel: primero los colaboradores
  (`Avatar` `size="sm"` con `ring-2 ring-background`, tooltip `username · rol`, tope 4 + contador
  `+N`), separador, y el usuario logueado al final con `ring-2 ring-primary` para distinguirlo
  ("Vos · username"). Color determinístico por usuario vía `colorAvatar()` (ver `src/lib/avatar.ts`
  — extraído de `project-card.tsx` porque ya se usa en 2+ lugares, regla del proyecto). Rutas
  anidadas en `App.tsx`: `/proyectos/:id` → `ProjectLayout`, con `tareas`/`notas`/`xmi`/`generador`
  como hijas. `index` redirige a `tareas` por ahora — **cambiar a `diagrama` el día que se
  construya ese módulo.**
- **`features/tasks/`** (nuevo, completo) — Kanban de 3 columnas (`PENDIENTE`/`EN_PROGRESO`/`HECHO`),
  crear tarea (con asignado opcional vía `useProjectMembers`), eliminar. Mismos endpoints reales de
  `modules/proyecto/tareas` del backend. `TaskCard` (2026-09-08) ajustado para parecerse al boceto:
  el avatar del asignado va superpuesto en la esquina inferior derecha de la tarjeta (`absolute
  -right-2 -bottom-2`, requiere `overflow-visible` en el `Card` porque por defecto trae
  `overflow-hidden`), color determinístico vía `colorAvatar()`. Cambiar de estado (2026-09-08,
  pedido explícito) ya **no es un `Select`** — son dos flechas (`ChevronLeft`/`ChevronRight`) en el
  footer de la tarjeta que avanzan/retroceden un paso en `ESTADOS_ORDEN` (`task-card.data.ts`:
  `PENDIENTE → EN_PROGRESO → HECHO`), deshabilitadas en cada punta. Sigue sin ser drag-and-drop —
  fuera de alcance.
- **`features/notes/`** (nuevo, completo) — feed tipo timeline, crear nota (acción + motivo).
- **`features/xmi/`** y **`features/generator/`** (nuevos, **solo placeholder**) — el backend no
  tiene Fase 3 (XMI) ni Fase 4 (generador) construidas todavía, así que estas páginas son un
  `Empty` con "próximamente" y botones `disabled` — nada de funcionalidad simulada. El generador
  ya deja anotado en el copy que **solo genera Spring Boot**, sin selector de otro framework.
- **`src/hooks/useAuth.ts`** (nuevo) — lee `user`/`token` de `localStorage`, expone `logout()`.
- **Pendiente real:** `features/diagram/` (el editor de canvas, React Flow) — explícitamente
  fuera de esta tanda de trabajo.

---

## 🧰 0. Stack y herramientas instaladas

- **Framework:** Vite + React 19 + TypeScript + Tailwind v4 + `react-router-dom` (`BrowserRouter` envuelve `<App />` en `main.tsx`).
- **UI:** shadcn (`components.json`: style `base-luma`, base color `stone`, iconos `lucide-react`) sobre **Base UI** (`@base-ui/react`, no Radix) — instalado con preset propio del usuario (`npx shadcn@latest init --preset bKsI1x32 --template vite`). Tema con paleta rojiza (oklch), tipografía Inter Variable, radios grandes (`--radius: 0.875rem`), light/dark en `src/index.css`.
  Agregar componentes: `npx shadcn@latest add <componente>` → quedan en `src/components/ui/`.
- **Alias `@/*` → `src/*`**: configurado en `tsconfig.json`/`tsconfig.app.json` y `vite.config.ts` (requisito de shadcn, no venía en el scaffold de Vite).
- **Skill + MCP de shadcn instalados** (`npx skills add shadcn/ui` + `npx shadcn@latest mcp init --client claude`): `.agents/skills/shadcn` (reglas de estilo/forms/composición, detecta Base UI vs Radix automáticamente) y `.agents/skills/migrate-radix-to-base`, más `.mcp.json` con el servidor MCP `shadcn` para buscar/instalar componentes de registries. Claude Code pide aprobar `.mcp.json` la primera vez que se abre sesión acá.
- **Variables:** `.env` / `.env.example` — `VITE_API_URL=http://localhost:8081` (nota: `VITE_*` es
  build-time en Vite, no runtime; hoy `useLogin.ts` llama al backend con la URL hardcodeada
  `http://localhost:8081`, no lee esta variable todavía — funciona igual en Docker porque el
  fetch lo hace el navegador del host, no el contenedor, y el puerto está mapeado 1:1).
- **Levantar (dev):** `npm run dev` (puerto `5173`, ya permitido en el CORS del backend).
- **Docker (agregado 2026-09-05):** `Dockerfile` multi-stage (Node build → `nginx:alpine`,
  `nginx.conf` con SPA fallback a `index.html`). Sin config de runtime (`window.__env`) como en
  los otros proyectos — no hizo falta porque el fetch nunca corre dentro del contenedor. Se
  levanta junto al backend y Postgres vía `../docker-compose.yml`, puerto `5173` (mapeado a
  Nginx `80` adentro).

---

## 🏛️ 1. Principios Arquitectónicos Fundamentales

### A. Arquitectura Orientada a Features (Bulletproof React)
No organizamos el código por tipo técnico (no amontonamos todos los componentes en una sola carpeta `components/` ni todos los hooks en `hooks/`). En su lugar, organizamos el código por **dominios de negocio** en `src/features/`. Cada feature es un módulo autocontenido que encapsula:
- Sus propios tipos (`types/`)
- Sus peticiones a la API (`api/`)
- Sus componentes visuales (`components/`)
- Su lógica de estado (`hooks/`)
- Sus páginas o vistas (`pages/`)

### B. Regla Estricta "Anti-1k-Lines" (Archivos pequeños y legibles)
**Ningún archivo debe superar las 100-150 líneas de código.**
Para lograrlo, aplicamos obligatoriamente tres técnicas:
1. **Thin Pages (Páginas delgadas, < 30 líneas):** Las páginas en `pages/` solo actúan como orquestadores. Importan el layout y renderizan el contenedor de la feature. Cero lógica de negocio y cero peticiones directas.
2. **Separación de Lógica y Presentación (Custom Hooks):** La lógica de validación, llamadas HTTP, estados de carga y manejo de errores vive en hooks (`useLogin.ts`, `useDiagram.ts`), **no** dentro del JSX.
3. **Data-Driven UI (`*.data.ts`):** Textos largos, configuraciones, listas de enlaces, opciones de selección y metadatos se extraen a un archivo `*.data.ts` complementario. El archivo `.tsx` solo itera y renderiza.

### C. Patrón de Carpeta por Componente (solo cuando se justifica)
El patrón en carpeta con `.data.ts` separado **no es un default parejo** — es ceremonia real (3-4 archivos por componente) y cada archivo de más es tiempo que compite con el generador de backend (Fase 4, lo que se demuestra en vivo el día del examen) y con la documentación formal (Fase 8, que todavía no arrancó y pesa en la nota independientemente del código). Se usa **solo** cuando el componente cumple alguna de estas condiciones:
- Se reutiliza en 2+ lugares, o
- Supera ~80 líneas de JSX, o
- Tiene una lista de configuración/opciones que realmente conviene separar para legibilidad (ej. `toolbar.data.ts` con la lista de acciones del canvas).

Para componentes chicos y de un solo uso (el caso típico de `login-form`/`register-form`: 4-5 campos, sin reutilización, sin i18n en el alcance del parcial), un único archivo `.tsx` es suficiente — no forzar `.data.ts`/`index.ts` para eso.

```text
nombre-componente/
├── nombre-componente.tsx       # JSX y renderizado visual (< 80 líneas)
├── nombre-componente.data.ts  # Textos, labels, placeholders y configuraciones estáticas (solo si aplica el criterio de arriba)
├── nombre-componente.types.ts # Interfaces y tipos exclusivos de este componente (opcional)
└── index.ts                   # Exportación limpia (export * from './nombre-componente')
```

### D. Componentes UI Primitivos (shadcn / Base UI)
- La carpeta `src/components/ui/` es exclusiva para primitivas visuales de diseño instaladas vía shadcn (`button.tsx`, `card.tsx`, `input.tsx`, etc.).
- **Prohibido** meter lógica de negocio o llamadas a la API dentro de `src/components/ui/`.

### E. Hooks: Locales vs Globales (Regla de Promoción)
- **Hooks de Dominio (Locales en `features/<modulo>/hooks/`):** Si un hook solo lo utiliza un módulo específico (ej. `useLogin`, `useDiagramSync`), debe vivir dentro de la feature correspondiente.
- **Hooks Globales (en `src/hooks/`):** Si un hook es una utilidad técnica agnóstica (`useDebounce`, `useLocalStorage`, `useMediaQuery`) o si **2 o más módulos** necesitan compartir exactamente la misma lógica (ej. `useAuth` para leer la sesión en el navbar de proyectos y en el editor UML), se **promociona** a `src/hooks/` para acceso global vía `@/hooks/...`.

---

## 🌲 2. Árbol Proyectado Completo de `case-frontend` (Proyecto Terminado)

```text
case-frontend/
├── public/
│   └── icons/                         # Favicons e íconos estáticos
├── src/
│   ├── assets/                        # Imágenes, logos SVG e ilustraciones
│   │   ├── logo.svg
│   │   └── empty-canvas.svg
│   │
│   ├── components/                    # Componentes compartidos transversales
│   │   ├── ui/                        # Primitivas shadcn (Base UI + Tailwind v4)
│   │   │   ├── button.tsx             # ✅ instalado
│   │   │   ├── card.tsx               # ✅ instalado
│   │   │   ├── input.tsx              # ✅ instalado
│   │   │   ├── label.tsx              # ✅ instalado
│   │   │   ├── field.tsx              # ✅ instalado (FieldGroup/FieldLabel/FieldDescription)
│   │   │   ├── separator.tsx          # ✅ instalado (dependencia de card)
│   │   │   ├── dialog.tsx             # ✅ instalado
│   │   │   ├── dropdown-menu.tsx      # ✅ instalado
│   │   │   ├── badge.tsx              # ✅ instalado
│   │   │   ├── textarea.tsx           # ✅ instalado
│   │   │   ├── avatar.tsx             # ✅ instalado
│   │   │   ├── tooltip.tsx            # ✅ instalado
│   │   │   ├── sheet.tsx              # 🔜 pendiente
│   │   │   └── toast.tsx              # 🔜 pendiente
│   │   ├── feedback/                  # Componentes de estado global
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── common/                    # Componentes reutilizables generales
│   │       ├── ConfirmDialog.tsx
│   │       ├── SearchInput.tsx
│   │       └── project-nav-rail/      # 🆕 extraído de ProjectLayout (2026-09-06) — la lista de
│   │           ├── project-nav-rail.tsx     #   items del riel (Diagrama/Tareas/Notas/XMI/
│   │           ├── project-nav-rail.data.ts #   Generador + volver) es justo el caso que la
│   │           └── index.ts                 #   sección 1.C pide separar en .data.ts: es una
│   │                                         #   lista de configuración real ({icono, label,
│   │                                         #   path} por item), no texto suelto. (2026-09-08)
│   │                                         #   también renderiza acá los avatares de colaboradores
│   │                                         #   + usuario actual (antes vivían en una barra superior
│   │                                         #   de ProjectLayout, se sacaron por pedido explícito).
│   │
│   ├── layouts/                       # Estructuras de cascarón visual
│   │   ├── AuthLayout.tsx             # Para Login / Register (centrado o split)
│   │   ├── DashboardLayout.tsx        # Con Navbar superior y navegación principal (dashboard de proyectos)
│   │   ├── ProjectLayout.tsx          # 🆕 Cascarón de todo lo de "dentro" de un proyecto — confirmado
│   │   │                              #   por el prototipo (2026-09-06). Página delgada: solo compone
│   │   │                              #   <ProjectNavRail /> (components/common/) + `<Outlet/>`. **Sin
│   │   │                              #   barra superior** (2026-09-08) — ni breadcrumb ni avatares acá;
│   │   │                              #   los avatares viven en el riel (ver project-nav-rail arriba).
│   │   │                              #   La lista de items del riel NO vive acá tampoco — está en
│   │   │                              #   project-nav-rail.data.ts (ver componente).
│   │   │                              #   DiagramEditorPage y las futuras ProjectTasksPage/
│   │   │                              #   ProjectNotesPage viven DENTRO de este layout, no cada una con
│   │   │                              #   su propio cascarón suelto.
│   │   └── CanvasLayout.tsx           # Pantalla completa SOLO para el área de canvas (toolbar, zoom,
│   │                                  #   minimapa) — se monta DENTRO de ProjectLayout en la ruta del
│   │                                  #   Diagrama, no lo reemplaza.
│   │
│   ├── lib/                           # Configuraciones de clientes e infraestructura
│   │   ├── api.ts                     # ✅ existe (2026-09-06), solo `API_URL` desde
│   │   │                              #   `import.meta.env.VITE_API_URL` por ahora — 🔜 falta el
│   │   │                              #   interceptor de JWT (adjuntar `Authorization: Bearer`
│   │   │                              #   automático). `authApi.ts` ya lo usa; el resto de los
│   │   │                              #   `xxxApi.ts` futuros deben importar `API_URL` de acá,
│   │   │                              #   nunca hardcodear `http://localhost:8081` de nuevo
│   │   ├── utils.ts                   # cn() y formateadores generales
│   │   ├── avatar.ts                  # ✅ existe (2026-09-08) — `colorAvatar()` (color determinístico
│   │   │                              #   por hash de id) + `iniciales()`. Extraído de
│   │   │                              #   `project-card.tsx` al reusarse en `project-nav-rail` y
│   │   │                              #   `task-card` — regla de extracción del proyecto (2+ lugares)
│   │   └── constants.ts               # Constantes globales del sistema
│   │
│   ├── routes/                        # Enrutamiento de la aplicación
│   │   ├── AppRoutes.tsx              # Definición central de rutas con react-router-dom
│   │   └── ProtectedRoute.tsx         # Guardián de rutas autenticadas
│   │
│   ├── context/                       # Estado transversal global (React Context / Zustand)
│   │   ├── AuthContext.tsx            # Estado del usuario activo, token y logout
│   │   └── ThemeContext.tsx           # Modo oscuro / claro
│   │
│   ├── hooks/                         # 🌐 HOOKS COMPARTIDOS / GLOBALES (usados por 2+ módulos)
│   │   ├── useAuth.ts                 # Hook para consumir AuthContext en cualquier feature
│   │   ├── useDebounce.ts             # Para búsquedas retrasadas (proyectos, atributos)
│   │   ├── useLocalStorage.ts         # Persistencia de preferencias del editor
│   │   ├── useMediaQuery.ts           # Detección responsiva (móvil vs desktop)
│   │   └── useClickOutside.ts         # Cerrar popovers y menús contextuales
│   │
│   └── features/                      # 🚀 MÓDULOS DE NEGOCIO (Package-by-Feature)
│       │
│       ├── auth/                      # Módulo 1: Autenticación
│       │   ├── api/
│       │   │   └── authApi.ts         # login(), register(), getMe()
│       │   ├── types/
│       │   │   └── auth.types.ts      # LoginRequest, RegisterRequest, AuthResponse
│       │   ├── hooks/
│       │   │   ├── useLogin.ts        # Manejo de login, loading, errores
│       │   │   └── useRegister.ts     # Manejo de registro
│       │   ├── components/
│       │   │   ├── login-form/
│       │   │   │   ├── login-form.tsx
│       │   │   │   ├── login-form.data.ts
│       │   │   │   └── index.ts
│       │   │   └── register-form/
│       │   │       ├── register-form.tsx
│       │   │       ├── register-form.data.ts
│       │   │       └── index.ts
│       │   └── pages/
│       │       ├── LoginPage.tsx      # Vista pública /login
│       │       └── RegisterPage.tsx   # Vista pública /register
│       │
│       ├── projects/                  # Módulo 2: Gestión de Proyectos + colaboradores
│       │   ├── api/
│       │   │   └── projectsApi.ts     # getMyProjects(), createProject(), delete(),
│       │   │                          #   addMember(projectId, usuario), removeMember(...)
│       │   │                          #   + notas/tareas del proyecto (ver abajo)
│       │   ├── types/
│       │   │   └── projects.types.ts  # Proyecto, ProyectoRequest, ProyectoResponse,
│       │   │                          #   MiembroProyecto, RolProyecto (ADMIN, COLABORADOR,
│       │   │                          #   LECTOR — corregido 2026-09-06, ya no es solo ADMIN/MIEMBRO),
│       │   │                          #   NotaProyecto, TareaProyecto — los 4 ya construidos en el
│       │   │                          #   backend (`modules/proyecto`), falta el frontend
│       │   ├── hooks/
│       │   │   ├── useProjects.ts
│       │   │   ├── useProjectMutations.ts
│       │   │   └── useProjectMembers.ts   # colaboradores directos del proyecto (sin Grupo)
│       │   ├── components/
│       │   │   ├── project-card/      # 🔄 confirmado por el prototipo: título + pill de estado
│       │   │   │                      #   (Activo/Archivado), descripción, stack de avatares
│       │   │   │                      #   superpuestos (máx. 4 + contador "+N"), "hace Xh/días" de
│       │   │   │                      #   última edición
│       │   │   ├── project-grid/      # 🔄 confirmado: grilla + buscador + toggle Tarjetas/Lista
│       │   │   │                      #   (ver project-view-toggle/ abajo) + tarjeta fantasma final
│       │   │   │                      #   "+ Crear proyecto nuevo"
│       │   │   ├── project-view-toggle/ # 🆕 confirmado por el prototipo: switch Tarjetas | Lista
│       │   │   ├── create-project-dialog/
│       │   │   └── project-members-dialog/ # Agregar/quitar colaboradores de ESE proyecto
│       │   └── pages/
│       │       └── ProjectsDashboardPage.tsx
│       │
│       │   # Nota (2026-09-05): sustantivos de dominio en español (Proyecto, NotaProyecto,
│       │   # TareaProyecto) para que coincidan 1:1 con las entidades del backend. Nombres de carpetas,
│       │   # archivos y rutas se quedan en inglés (convención normal de proyectos JS/TS).
│       │
│       ├── diagram/                   # Módulo 3: Lienzo UML (@xyflow/react)
│       │   ├── api/
│       │   │   └── diagramApi.ts      # getDiagram(projectId), saveEntities(), saveRelations()
│       │   ├── types/
│       │   ├── diagram.types.ts   # EntidadDiagrama, AtributoEntidad, RelacionDiagrama
│       │   │   └── canvas.types.ts    # Nodos y bordes de React Flow
│       │   ├── hooks/
│       │   │   ├── useDiagramSync.ts  # Carga y persistencia del diagrama
│       │   │   ├── useDiagramHistory.ts # Undo / Redo
│       │   │   └── useCanvasShortcuts.ts # Atajos de teclado (Ctrl+Z, Supr, etc.)
│       │   ├── components/
│       │   │   ├── nodes/
│       │   │   │   ├── EntityNode.tsx # Nodo de tabla/clase UML — header con nombre editable,
│       │   │   │   │                  #   botón "eliminar tabla" y botón "+ atributo" al final;
│       │   │   │   │                  #   delega cada fila a node-attribute-row/ (abajo)
│       │   │   │   └── node-attribute-row/  # 🔄 confirmado por el prototipo: pasa de archivo suelto
│       │   │   │       ├── node-attribute-row.tsx      #   a carpeta (2026-09-06) — ahora sí aplica
│       │   │   │       ├── node-attribute-row.data.ts  #   el criterio de la sección 1.C: el combobox
│       │   │   │       │                                #   de tipo SQL es una lista de opciones real
│       │   │   │       │                                #   (VARCHAR, INT, BOOLEAN, DATE, DECIMAL...),
│       │   │   │       │                                #   no texto suelto. Edita inline: input de
│       │   │   │       │                                #   nombre, combobox de tipo, toggles
│       │   │   │       │                                #   PK/FK/NULL, botón "×". Clase `nodrag` en
│       │   │   │       │                                #   los inputs para no pelear con el drag del
│       │   │   │       │                                #   nodo (React Flow)
│       │   │   │       └── index.ts
│       │   │   ├── edges/
│       │   │   │   └── UmlRelationEdge.tsx # Conectores 1:1, 1:N, N:M con multiplicidad
│       │   │   ├── toolbar/
│       │   │   │   ├── CanvasToolbar.tsx # Agregar tabla, zoom, exportar, deshacer
│       │   │   │   └── toolbar.data.ts
│       │   │   ├── ai-command-bar/    # 🆕 confirmado por el prototipo: input flotante abajo-
│       │   │   │                      #   centro, "Pide un cambio al modelo... ⌘K" + botón de
│       │   │   │                      #   voz + enviar — UI conjunta de CU13 (generar backend) y
│       │   │   │                      #   CU14 (voz); el mic de acá reemplaza al voice-mic-button
│       │   │   │                      #   flotante que tenía planeado el módulo voice/ por separado
│       │   │   └── minimap/
│       │   │       └── CanvasMinimap.tsx # esquina inferior derecha — confirmado, sin cambios
│       │   └── pages/
│       │       └── DiagramEditorPage.tsx # Vista principal del modelador UML
│       │
│       ├── xmi/                       # Módulo 4: Interoperabilidad Enterprise Architect
│       │   ├── api/
│       │   │   └── xmiApi.ts          # exportXmi(projectId), importXmi(file)
│       │   ├── hooks/
│       │   │   └── useXmiExchange.ts
│       │   ├── components/
│       │   │   ├── xmi-export-button/
│       │   │   └── xmi-import-modal/
│       │   └── types/
│       │       └── xmi.types.ts
│       │
│       ├── generator/                 # Módulo 5: Generador de Backend Spring Boot
│       │   ├── api/
│       │   │   └── generatorApi.ts    # generateBackendZip(projectId), previewCode()
│       │   ├── hooks/
│       │   │   └── useCodeGenerator.ts
│       │   ├── components/
│       │   │   ├── code-preview-modal/ # Vista previa de entidades generadas
│       │   │   └── download-zip-card/
│       │   └── types/
│       │       └── generator.types.ts
│       │
│       ├── voice/                     # Módulo 6: Control Asistido por Voz (Web Speech API)
│       │   ├── hooks/
│       │   │   └── useVoiceCommands.ts # Escucha micrófono y mapea intención ("crear tabla X")
│       │   ├── parser/
│       │   │   └── commandParser.ts   # Intérprete de lenguaje natural a acciones del lienzo
│       │   └── components/
│       │       └── voice-mic-button/   # 🔄 sigue existiendo para uso fuera del canvas (ej. dashboard
│       │                              #   de proyectos), pero DENTRO del editor de diagrama el mic ya
│       │                              #   vive integrado en `diagram/components/ai-command-bar/` — no
│       │                              #   duplicar el botón flotante ahí.
│       │
│       └── collaboration/             # Módulo 7: Tiempo Real (WebSocket / STOMP)
│           ├── api/
│           │   └── stompClient.ts     # Conexión socket a /ws-case
│           ├── hooks/
│           │   ├── useCollaboration.ts # Envío y recepción de deltas de nodos y relaciones
│           │   └── usePresence.ts     # Lista de usuarios activos en el diagrama
│           ├── components/
│           │   ├── remote-cursor/     # Punteros en vivo de otros colaboradores del proyecto
│           │   └── active-users-badge/
│           └── types/
│               └── socket.types.ts
│
├── .env                               # VITE_API_URL=http://localhost:8081
├── components.json                    # Configuración shadcn (Base UI + base-luma)
├── vite.config.ts                     # Alias @ -> ./src
└── tsconfig.json                      # Configuración TypeScript
```

---

## 🛠️ 3. Reglas de Implementación para Agentes IA

Cuando generes o refactorices código en este repositorio, debes cumplir estas reglas sin excepción:

1. **Nunca crees archivos monolíticos:** Si un archivo supera 100 líneas, debes descomponerlo:
   - Extrae constantes y textos a `*.data.ts` **solo si el componente se reutiliza, supera ~80 líneas, o tiene una lista de configuración real que lo justifique** (ver sección 1.C) — no por defecto en cada componente chico.
   - Extrae lógica compleja a un hook `use*.ts`.
   - Extrae subcomponentes a la carpeta del componente.
2. **Usa siempre el alias `@/`:** Nunca uses rutas relativas largas como `../../../../components/ui/button`. Usa `@/components/ui/button`.
3. **No uses `'use client'`:** Este proyecto es una Single Page Application (SPA) en **Vite + React 19**, no Next.js.
4. **Navegación con `react-router-dom`:**
   - Usar `<Link to="...">` en lugar de etiquetas `<a href="...">` para navegación interna.
   - Usar `useNavigate()` en lugar de `useRouter()`.
5. **Formularios limpios y tipados:**
   - Para formularios simples, usa componentes controlados con hooks separados.
   - Para formularios complejos, usa **React Hook Form** + validación con esquemas **Zod**.
6. **Manejo de Errores y Estados de Carga:** Todo componente que realice peticiones asíncronas debe exponer o contemplar estados de `loading`, `error` y `success` para brindar feedback claro al usuario.
