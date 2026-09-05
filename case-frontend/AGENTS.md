# CASE Frontend — Arquitectura, Guía de Diseño y Árbol Proyectado

Este documento define la arquitectura técnica, los patrones de diseño y la estructura completa de carpetas de `case-frontend` para el desarrollo del proyecto **CASE Tool** (Ingeniería de Software). Es la fuente de verdad exclusiva del frontend — el `AGENTS.md` de la raíz del repo solo enlaza para acá.

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas directrices de forma obligatoria.

---

## 🧰 0. Stack y herramientas instaladas

- **Framework:** Vite + React 19 + TypeScript + Tailwind v4 + `react-router-dom` (`BrowserRouter` envuelve `<App />` en `main.tsx`).
- **UI:** shadcn (`components.json`: style `base-luma`, base color `stone`, iconos `lucide-react`) sobre **Base UI** (`@base-ui/react`, no Radix) — instalado con preset propio del usuario (`npx shadcn@latest init --preset bKsI1x32 --template vite`). Tema con paleta rojiza (oklch), tipografía Inter Variable, radios grandes (`--radius: 0.875rem`), light/dark en `src/index.css`.
  Agregar componentes: `npx shadcn@latest add <componente>` → quedan en `src/components/ui/`.
- **Alias `@/*` → `src/*`**: configurado en `tsconfig.json`/`tsconfig.app.json` y `vite.config.ts` (requisito de shadcn, no venía en el scaffold de Vite).
- **Skill + MCP de shadcn instalados** (`npx skills add shadcn/ui` + `npx shadcn@latest mcp init --client claude`): `.agents/skills/shadcn` (reglas de estilo/forms/composición, detecta Base UI vs Radix automáticamente) y `.agents/skills/migrate-radix-to-base`, más `.mcp.json` con el servidor MCP `shadcn` para buscar/instalar componentes de registries. Claude Code pide aprobar `.mcp.json` la primera vez que se abre sesión acá.
- **Variables:** `.env` / `.env.example` — `VITE_API_URL=http://localhost:8081`.
- **Levantar:** `npm run dev` (puerto `5173`, ya permitido en el CORS del backend).

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
│   │   │   ├── dialog.tsx             # 🔜 pendiente, agregar con `npx shadcn add dialog`
│   │   │   ├── dropdown-menu.tsx      # 🔜 pendiente
│   │   │   ├── sheet.tsx              # 🔜 pendiente
│   │   │   ├── badge.tsx              # 🔜 pendiente
│   │   │   ├── tooltip.tsx            # 🔜 pendiente
│   │   │   └── toast.tsx              # 🔜 pendiente
│   │   ├── feedback/                  # Componentes de estado global
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── common/                    # Componentes reutilizables generales
│   │       ├── ConfirmDialog.tsx
│   │       └── SearchInput.tsx
│   │
│   ├── layouts/                       # Estructuras de cascarón visual
│   │   ├── AuthLayout.tsx             # Para Login / Register (centrado o split)
│   │   ├── DashboardLayout.tsx        # Con Navbar superior y navegación de grupos
│   │   └── CanvasLayout.tsx           # Pantalla completa con Toolbar para el editor UML
│   │
│   ├── lib/                           # Configuraciones de clientes e infraestructura
│   │   ├── api.ts                     # Cliente fetch/axios con baseURL y JWT interceptor
│   │   ├── utils.ts                   # cn() y formateadores generales
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
│       ├── groups/                    # Módulo 2: Grupos de Trabajo Colaborativo
│       │   ├── api/
│       │   │   └── groupsApi.ts       # getGrupos(), crearGrupo(), agregarMiembro()
│       │   ├── types/
│       │   │   └── groups.types.ts    # Grupo, GrupoMiembro, RolGrupo (ADMIN, MIEMBRO)
│       │   ├── hooks/
│       │   │   ├── useGroups.ts
│       │   │   └── useGroupMembers.ts
│       │   ├── components/
│       │   │   ├── group-selector/    # Dropdown en navbar para cambiar de grupo
│       │   │   ├── group-card/
│       │   │   └── member-list/
│       │   └── pages/
│       │       └── GroupsPage.tsx     # Gestión de equipos e invitaciones
│       │
│       ├── projects/                  # Módulo 3: Gestión de Proyectos
│       │   ├── api/
│       │   │   └── projectsApi.ts     # getProjectsByGroup(), createProject(), delete()
│       │   ├── types/
│       │   │   └── projects.types.ts  # Project, ProjectRequest, ProjectResponse
│       │   ├── hooks/
│       │   │   ├── useProjects.ts
│       │   │   └── useProjectMutations.ts
│       │   ├── components/
│       │   │   ├── project-card/      # Tarjeta individual de proyecto
│       │   │   ├── project-grid/      # Grilla de proyectos con búsqueda
│       │   │   └── create-project-dialog/
│       │   └── pages/
│       │       └── ProjectsDashboardPage.tsx
│       │
│       ├── diagram/                   # Módulo 4: Lienzo UML (@xyflow/react)
│       │   ├── api/
│       │   │   └── diagramApi.ts      # getDiagram(projectId), saveEntities(), saveRelations()
│       │   ├── types/
│       │   ├── diagram.types.ts   # DiagramEntity, EntityAttribute, DiagramRelation
│       │   │   └── canvas.types.ts    # Nodos y bordes de React Flow
│       │   ├── hooks/
│       │   │   ├── useDiagramSync.ts  # Carga y persistencia del diagrama
│       │   │   ├── useDiagramHistory.ts # Undo / Redo
│       │   │   └── useCanvasShortcuts.ts # Atajos de teclado (Ctrl+Z, Supr, etc.)
│       │   ├── components/
│       │   │   ├── nodes/
│       │   │   │   ├── EntityNode.tsx # Nodo de tabla/clase UML con PK, FK, tipos
│       │   │   │   └── NodeAttributeRow.tsx
│       │   │   ├── edges/
│       │   │   │   └── UmlRelationEdge.tsx # Conectores 1:1, 1:N, N:M con multiplicidad
│       │   │   ├── toolbar/
│       │   │   │   ├── CanvasToolbar.tsx # Agregar tabla, zoom, exportar, deshacer
│       │   │   │   └── toolbar.data.ts
│       │   │   ├── entity-editor-panel/  # Sidebar para editar atributos y tipos SQL
│       │   │   └── minimap/
│       │   │       └── CanvasMinimap.tsx
│       │   └── pages/
│       │       └── DiagramEditorPage.tsx # Vista principal del modelador UML
│       │
│       ├── xmi/                       # Módulo 5: Interoperabilidad Enterprise Architect
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
│       ├── generator/                 # Módulo 6: Generador de Backend Spring Boot
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
│       ├── voice/                     # Módulo 7: Control Asistido por Voz (Web Speech API)
│       │   ├── hooks/
│       │   │   └── useVoiceCommands.ts # Escucha micrófono y mapea intención ("crear tabla X")
│       │   ├── parser/
│       │   │   └── commandParser.ts   # Intérprete de lenguaje natural a acciones del lienzo
│       │   └── components/
│       │       └── voice-mic-button/   # Botón flotante de dictado con indicador visual
│       │
│       └── collaboration/             # Módulo 8: Tiempo Real (WebSocket / STOMP)
│           ├── api/
│           │   └── stompClient.ts     # Conexión socket a /ws-case
│           ├── hooks/
│           │   ├── useCollaboration.ts # Envío y recepción de deltas de nodos y relaciones
│           │   └── usePresence.ts     # Lista de usuarios activos en el diagrama
│           ├── components/
│           │   ├── remote-cursor/     # Punteros en vivo de otros compañeros de grupo
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
