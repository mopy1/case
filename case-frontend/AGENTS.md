# 🤖 Guía Técnica de Arquitectura Frontend — CASE Tool (React 19 + Vite)

> **Documento para Agentes de IA y Desarrolladores.**  
> Esta guía define el estado actual, la estructura de componentes, los patrones de diseño y las reglas operativas del frontend. **No es un registro histórico; es la especificación técnica viva de la interfaz de usuario.**

---

## 🎯 1. Propósito y Stack Tecnológico

El frontend proporciona la interfaz interactiva para la **Herramienta CASE Colaborativa**. Soporta la gestión de proyectos, tableros Kanban de tareas, bitácora de decisiones de diseño, un lienzo visual para diagramas entidad-relación/UML con persistencia instantánea y exportación/importación XMI.

- **Librería Core:** React 19 (`react`, `react-dom`)
- **Lenguaje:** TypeScript 5.x (modo estricto)
- **Tooling & Bundler:** Vite 8.x
- **Estilos:** Tailwind CSS v4 (`@import "tailwindcss"`) + animaciones (`tw-animate-css`)
- **Sistema de Componentes:** shadcn / Base UI (`@base-ui/react`, variante `base-luma`)
- **Canvas / Diagramación:** React Flow (`@xyflow/react` v12.4+)
- **Iconografía:** Lucide React (`lucide-react`)
- **Enrutamiento:** React Router DOM v7 (`react-router-dom`)
- **Tipografía:** Inter Variable (`@fontsource-variable/inter`)

---

## 🏗️ 2. Estructura Real del Código Fuente

```text
case-frontend/src/
├── App.tsx                                   # Rutas principales con Code-Splitting (React.lazy + Suspense)
├── main.tsx                                  # Entrada principal: importa @xyflow/react/dist/style.css antes de index.css
├── index.css                                 # Tokens globales de tema en OKLCH (.dark) y blindaje de React Flow
│
├── components/
│   ├── ui/                                   # 🧩 Primitivas visuales shadcn (Base UI + Tailwind v4)
│   │   ├── button.tsx, card.tsx, input.tsx, select.tsx, dialog.tsx, dropdown-menu.tsx,
│   │   ├── tooltip.tsx, badge.tsx, alert.tsx, skeleton.tsx, textarea.tsx, separator.tsx, etc.
│   └── common/                               # 🪟 Componentes de UI transversales reutilizables
│       ├── ConfirmDialog.tsx                 # Modal de confirmación para borrado de entidades/tareas/miembros
│       ├── UserAvatarMenu.tsx                # Avatar con menú dropdown de usuario y logout unificado
│       └── project-nav-rail/                 # Riel de navegación lateral con enlaces, colaboradores y logout
│           ├── index.ts, project-nav-rail.tsx, project-nav-rail.data.ts
│
├── layouts/
│   └── ProjectLayout.tsx                     # Shell común para las vistas de un proyecto (integra el riel lateral)
│
├── lib/
│   ├── api.ts                                # Cliente apiFetch() con inyección de JWT, manejo de 401, Blob y FormData
│   ├── avatar.ts                             # Generador de iniciales y colores determinísticos para avatares
│   └── utils.ts                              # Helper cn() para mezclar clases Tailwind con clsx y twMerge
│
├── routes/
│   ├── ProtectedRoute.tsx                    # Exige token JWT; si no existe, redirige a /login
│   └── GuestRoute.tsx                        # Exclusivo para no autenticados; redirige a /proyectos si ya hay sesión
│
├── hooks/
│   └── useAuth.ts                            # Hook de sesión: consulta /api/v1/auth/me, expone login(), logout()
│
└── features/                                 # 🚀 Vertical Slices de Negocio
    ├── auth/                                 # 🔑 Autenticación (Login y Registro)
    │   ├── api/authApi.ts                    # Endpoints /auth/login y /auth/register
    │   ├── components/login-form/            # Formulario de login desacoplado (form + .data.ts)
    │   ├── components/register-form/         # Formulario de registro desacoplado
    │   ├── hooks/useLogin.ts, useRegister.ts
    │   ├── pages/LoginPage.tsx, RegisterPage.tsx
    │   └── types/auth.types.ts
    │
    ├── projects/                             # 📁 Gestión de Proyectos y Colaboradores
    │   ├── api/projectsApi.ts                # CRUD de proyectos y gestión de miembros
    │   ├── components/create-project-dialog/ # Modal para crear nuevo proyecto
    │   ├── components/project-card/          # Tarjeta con metadata y colaboradores
    │   ├── components/project-members-dialog/# Modal de gestión de colaboradores (roles ADMIN/COLABORADOR/LECTOR)
    │   │   ├── index.ts, project-members-dialog.tsx, member-item.tsx, project-members-dialog.data.ts
    │   ├── hooks/useProjects.ts, useProject.ts, useProjectMembers.ts, useMemberMutations.ts
    │   ├── pages/ProjectsDashboardPage.tsx   # Dashboard con búsqueda instantánea memoizada
    │   └── types/projects.type.ts
    │
    ├── diagram/                              # 📐 Lienzo UML Interactivo (React Flow)
    │   ├── api/diagramApi.ts                 # Endpoints de entidades, atributos, relaciones y puntos de control
    │   ├── components/nodes/EntityNode.tsx   # Nodo de tabla con handles, PKs arriba, tipos SQL y badge N:M
    │   ├── components/edges/                 # Aristas especializadas
    │   │   ├── UmlRelationEdge.tsx           # Floating edge en ángulo recto con badges de multiplicidad
    │   │   ├── MultiplicidadBadge.tsx        # Selector dropdown de cardinalidad (0..1, 1..1, 0..*, 1..*)
    │   │   ├── PuntoControlHandle.tsx        # Manijas arrastrables para quiebre manual de líneas (Ctrl+arrastrar)
    │   │   ├── AssociationClassOverlay.tsx   # Línea punteada hacia tabla intermedia auto-generada
    │   │   └── RelationCrossingOverlay.tsx   # Detección y salto visual de aristas que se cruzan
    │   ├── components/panel/                 # Panel lateral de propiedades de tabla
    │   │   ├── entity-properties-panel.tsx   # Renombrar tabla y listado de atributos
    │   │   └── attribute-form-dialog.tsx     # Diálogo para añadir/editar atributos (PK, FK, tipo, nullable)
    │   ├── components/toolbar/CanvasToolbar  # Barra flotante superior (+ Entidad)
    │   ├── hooks/                            # Lógica del canvas desacoplada
    │   │   ├── useDiagramCanvas.ts           # Orquestador del canvas (nodes, edges, cambios, conexiones)
    │   │   ├── useDiagram.ts, useEntityMutations.ts, useAttributeMutations.ts, useRelationMutations.ts
    │   │   └── usePuntosControlArrastre.ts   # Manejo del arrastre de puntos de control
    │   ├── lib/                              # Utilidades geométricas y de mapeo
    │   │   ├── floatingEdge.ts               # Cálculo de intersección para anclar al borde más cercano
    │   │   ├── relationPath.ts               # Construcción de paths polilínea ortogonales
    │   │   ├── relationCrossing.ts           # Algoritmo AABB y de intersección de segmentos
    │   │   ├── controlPoints.ts, multiplicidad.ts, diagramMappers.ts, relationStyle.ts, relacionesDerivadas.ts
    │   ├── pages/DiagramEditorPage.tsx       # Thin Page (115 líneas) montando el canvas en modo oscuro
    │   └── types/diagram.types.ts
    │
    ├── tasks/                                # 📋 Tablero Kanban de Tareas del Proyecto
    │   ├── api/tasksApi.ts
    │   ├── components/create-task-dialog/    # Diálogo de creación de tareas con prioridad
    │   ├── components/task-card/             # Tarjeta de tarea con avance de estado y avatar asignado
    │   ├── hooks/useTasks.ts, useTaskMutations.ts
    │   ├── pages/ProjectTasksPage.tsx        # Kanban en 3 columnas (Pendiente, En Proceso, Completada)
    │   └── types/tasks.type.ts
    │
    ├── notes/                                # 📝 Bitácora de Decisiones de Diseño (Inmutable)
    │   ├── api/notesApi.ts
    │   ├── components/create-note-dialog/    # Diálogo de registro de nota con motivo obligatorio
    │   ├── components/note-item/             # Item de nota con autor, fecha y badge de acción
    │   ├── hooks/useNotes.ts, useNoteMutations.ts
    │   ├── pages/ProjectNotesPage.tsx        # Timeline cronológico de notas de diseño
    │   └── types/notes.type.ts
    │
    ├── xmi/                                  # 🔄 Intercambio XMI (Enterprise Architect)
    │   ├── api/xmiApi.ts                     # Descarga binaria (Blob) y subida multipart (FormData)
    │   ├── components/xmi-import-dialog.tsx  # Modal para subir archivos .xmi
    │   ├── hooks/useXmiExchange.ts           # Orquestador de exportar (descarga al navegador) e importar
    │   └── pages/ProjectXmiPage.tsx          # Vista funcional de interoperabilidad
    │
    └── generator/                            # ⚡ Generador de Backend Spring Boot (Fase 4 Completa)
        ├── api/generatorApi.ts               # Endpoints /generador/preview y /generador/descargar
        ├── components/                       # Árbol de archivos y visor de código interactivo
        │   ├── generator-file-tree.tsx, generator-code-viewer.tsx
        ├── hooks/useProjectGenerator.ts      # Hook que orquesta preview y descarga del .zip
        ├── pages/ProjectGeneratorPage.tsx    # Vista completa con métricas, árbol interactivo y descarga
        └── types/generator.types.ts
```

---

## 📐 3. Principios y Convenciones Arquitectónicas

1. **Regla Anti-1k-Lines y Componentes Atómicos:**
   - Ningún archivo debe exceder **100-150 líneas**. Si un componente crece, debe descomponerse en subcomponentes (`member-item.tsx`), archivos de configuración (`*.data.ts`) o custom hooks (`use*.ts`).
   - Las páginas en `pages/` son "Thin Pages": orquestan layout y contenedores sin realizar llamadas `fetch` directas.

2. **Vertical Slice Architecture:**
   - La funcionalidad se agrupa por dominio de negocio en `features/<nombre>/`.
   - Cada feature contiene sus propias subcarpetas `api/`, `components/`, `hooks/`, `pages/` y `types/`.
   - Componentes que se reutilizan en 2 o más features van en `components/common/`.

3. **Code-Splitting y Rendimiento:**
   - Todas las rutas pesadas en [`App.tsx`](file:///home/lmc/projects/sw-case/case-frontend/src/App.tsx) se cargan con `React.lazy()` y `Suspense` (`LoginPage`, `RegisterPage`, `ProjectsDashboardPage`, `DiagramEditorPage`, `ProjectTasksPage`, `ProjectNotesPage`, `ProjectXmiPage`, `ProjectGeneratorPage`).
   - El bundle inicial pesa apenas **~316 kB** (101 kB gzip). `@xyflow/react` queda aislado en su propio chunk.
   - En el canvas, los nodos y aristas usan `React.memo` para evitar re-renderizados innecesarios durante el arrastre.
   - El cálculo de cruce de aristas (`RelationCrossingOverlay`) utiliza un algoritmo de descarte previo por caja delimitadora (**AABB / Axis-Aligned Bounding Box**) para no saturar la CPU con cálculos $O(N \cdot M)$.

4. **Cliente HTTP Centralizado (`lib/api.ts`):**
   - Inyecta automáticamente el token Bearer desde `localStorage`.
   - Intercepta errores `401 Unauthorized`: limpia la sesión y redirige automáticamente a `/login`.
   - Detecta respuestas binarias (`application/octet-stream` o `application/xml`) retornando `response.blob()` directamente para descargas de archivos.

5. **Modo Oscuro y React Flow:**
   - La aplicación corre en modo oscuro por defecto (`<html class="dark">`).
   - La hoja de estilos `@xyflow/react/dist/style.css` **debe importarse siempre en `main.tsx` antes de `index.css`** para que las reglas personalizadas prevalezcan en la cascada.
   - En [`DiagramEditorPage.tsx`](file:///home/lmc/projects/sw-case/case-frontend/src/features/diagram/pages/DiagramEditorPage.tsx), el componente raíz `<ReactFlow />` debe incluir siempre `colorMode="dark"`.
   - Los tokens oficiales de xyflow (`--xy-minimap-background-color`, `--xy-controls-button-background-color`, etc.) se declaran en el bloque `.dark` de `index.css`.

---

## 📡 4. Mapa de Rutas de la Aplicación

| Ruta | Protección | Componente / Feature | Descripción |
| :--- | :--- | :--- | :--- |
| `/login` | `GuestRoute` | `LoginPage` | Inicio de sesión con credenciales |
| `/register` | `GuestRoute` | `RegisterPage` | Registro de nueva cuenta de usuario |
| `/` | - | Redirección automática | Redirige a `/proyectos` si hay sesión, o a `/login` |
| `/proyectos` | `ProtectedRoute` | `ProjectsDashboardPage` | Listado, búsqueda y creación de proyectos |
| `/proyectos/:id` | `ProtectedRoute` | Redirección interna | Redirige a `/proyectos/:id/diagrama` |
| `/proyectos/:id/diagrama` | `ProtectedRoute` | `DiagramEditorPage` | Lienzo UML de diseño de base de datos |
| `/proyectos/:id/tareas` | `ProtectedRoute` | `ProjectTasksPage` | Tablero Kanban de tareas por estado |
| `/proyectos/:id/notas` | `ProtectedRoute` | `ProjectNotesPage` | Historial cronológico de notas de diseño |
| `/proyectos/:id/xmi` | `ProtectedRoute` | `ProjectXmiPage` | Exportación e importación de archivos XMI 1.1 EA |
| `/proyectos/:id/generador`| `ProtectedRoute` | `ProjectGeneratorPage` | Generador de código Spring Boot (Fase 4) |

---

## 🚦 5. Matriz de Estado de Módulos

- [x] **Autenticación:** Login, registro y cierre de sesión con persistencia en `localStorage`.
- [x] **Proyectos y Miembros:** Dashboard, creación, edición, borrado en cascada y gestión de roles (`ADMIN`, `COLABORADOR`, `LECTOR`).
- [x] **Tareas (Kanban):** Creación, asignación a miembros, transición de estados y borrado.
- [x] **Notas:** Bitácora inmutable de decisiones con trazabilidad de autor y fecha.
- [x] **Diagramador UML:** Lienzo interactivo con arrastre de tablas, CRUD de atributos, aristas inteligentes en ángulo recto, selector de multiplicidad, clases de asociación N:M, puntos de control manuales y salto visual de líneas.
- [x] **Interoperabilidad XMI:** Descarga e importación funcional compatible con Enterprise Architect.
- [x] **Generador de Backend (Fase 4 Completa):** Descarga de proyecto en archivo ZIP con Spring Boot 3.4 / Java 21, vista previa interactiva del código fuente y métricas del proyecto generado.

---

## 💡 6. Reglas Operativas para Agentes IA (Do's & Don'ts)

1. **NO inflar componentes:** Todo archivo nuevo debe mantenerse por debajo de las 150 líneas. Extraer hooks y subcomponentes.
2. **NO romper el tema oscuro de React Flow:** Asegurar que `<ReactFlow colorMode="dark">` se mantenga activo y no inyectar hojas de estilos externas que anulen las variables de `index.css`.
3. **Verificación de build:** Tras realizar modificaciones en el frontend, ejecutar siempre:
   ```bash
   npm run build
   ```
   para validar que TypeScript y Vite compilan con 0 errores de tipado o empaquetado.
4. **Cero Git Push:** NUNCA ejecutar `git push`. Realizar únicamente commits locales concisos.
