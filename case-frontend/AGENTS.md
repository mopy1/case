# 🤖 Guía Técnica de Arquitectura Frontend — CASE Tool (React 19 v1.0)

> **Documento para Agentes de IA y Desarrolladores.**  
> Esta guía define el estado actual, la estructura real de componentes, los patrones de diseño y las reglas operativas del frontend. **Especificación técnica viva del sistema v1.0.**

---

## 🎯 1. Stack Tecnológico y Arquitectura

- **Librería Core:** React 19 (`react`, `react-dom`)
- **Lenguaje:** TypeScript 5.x (modo estricto)
- **Tooling & Bundler:** Vite 8.x
- **Estilos:** Tailwind CSS v4 (`@import "tailwindcss"`) + animaciones semánticas
- **Sistema de Componentes:** shadcn / Base UI (`@base-ui/react`, variante `base-luma`)
- **Canvas / Diagramación:** React Flow (`@xyflow/react` v12.4+)
- **Iconografía:** Lucide React (`lucide-react`)
- **Enrutamiento:** React Router DOM v7 (`react-router-dom`)
- **Tipografía:** Inter Variable (`@fontsource-variable/inter`)
- **Compresión Binaria:** JSZip + FileSaver (empaquetado ZIP client-side)

---

## 🏗️ 2. Estructura Real del Código Fuente

```text
case-frontend/src/
├── App.tsx                                   # Enrutamiento principal con Code-Splitting (React.lazy + Suspense)
├── main.tsx                                  # Entrada: importa @xyflow/react/dist/style.css antes de index.css
├── index.css                                 # Tokens semánticos de tema en OKLCH (.dark) y estilos de React Flow
│
├── components/
│   ├── ui/                                   # 🧩 Primitivas visuales shadcn (Base UI + Tailwind v4)
│   │   ├── button.tsx, card.tsx, input.tsx, select.tsx, dialog.tsx, dropdown-menu.tsx,
│   │   ├── tooltip.tsx, badge.tsx, alert.tsx, skeleton.tsx, textarea.tsx, separator.tsx, etc.
│   └── common/                               # 🪟 Componentes de UI transversales reutilizables
│       ├── ConfirmDialog.tsx                 # Modal de confirmación para borrado de entidades/tareas/miembros
│       ├── UserAvatarMenu.tsx                # Avatar con menú dropdown de usuario y logout unificado
│       └── project-nav-rail/                 # Riel de navegación lateral con enlaces, colaboradores y botón IA
│           ├── index.ts, project-nav-rail.tsx, project-nav-rail.data.ts
│
├── layouts/
│   └── ProjectLayout.tsx                     # Shell de proyecto con riel de navegación y Copilot adaptativo
│
├── hooks/
│   ├── useAuth.ts                            # Hook de sesión: consulta /api/v1/auth/me, expone login() y logout()
│   └── useIsMobile.ts                        # Detección reactiva de pantallas móviles (< 768px)
│
├── lib/
│   ├── api.ts                                # Cliente apiFetch() con Bearer JWT, manejo de 401, Blob y FormData
│   ├── avatar.ts                             # Generador determinístico de iniciales y colores de usuario
│   ├── projectCode.ts                        # Ofuscación bidireccional determinista de IDs (prj-xxxxxx) estilo Stripe
│   └── utils.ts                              # Helper cn() para mezclar clases con clsx y twMerge
│
├── routes/
│   ├── ProtectedRoute.tsx                    # Guarda de rutas: exige JWT, si no redirige a /login
│   └── GuestRoute.tsx                        # Guarda para invitados: redirige a /proyectos si ya hay sesión activa
│
└── features/                                 # 🚀 Vertical Slices de Negocio
    ├── auth/                                 # 🔑 Autenticación (Login y Registro)
    │   ├── api/authApi.ts, components/login-form/, components/register-form/
    │   ├── hooks/useLogin.ts, useRegister.ts, pages/LoginPage.tsx, RegisterPage.tsx
    │
    ├── projects/                             # 📁 Gestión de Proyectos y Colaboradores
    │   ├── api/projectsApi.ts, components/create-project-dialog/, components/project-card/
    │   ├── components/project-members-dialog/ (gestión de roles ADMIN, COLABORADOR, LECTOR)
    │   ├── hooks/useProjects.ts, useProject.ts, useProjectMembers.ts, useMemberMutations.ts
    │   └── pages/ProjectsDashboardPage.tsx   # Dashboard con búsqueda instantánea en memoria
    │
    ├── diagram/                              # 📐 Lienzo UML Interactivo (React Flow)
    │   ├── api/diagramApi.ts
    │   ├── components/nodes/EntityNode.tsx   # Nodo de tabla con handles, tipos SQL, PKs y badge N:M
    │   ├── components/edges/                 # Aristas especializadas en ángulo recto
    │   │   ├── UmlRelationEdge.tsx, MultiplicidadBadge.tsx, PuntoControlHandle.tsx,
    │   │   └── AssociationClassOverlay.tsx, RelationCrossingOverlay.tsx (salto visual de aristas)
    │   ├── components/panel/                 # Panel lateral de atributos y propiedades de tabla
    │   │   ├── entity-properties-panel.tsx, attribute-form-dialog.tsx
    │   ├── components/toolbar/CanvasToolbar  # Barra flotante superior (+ Entidad)
    │   ├── hooks/useDiagramCanvas.ts, useDiagram.ts, useEntityMutations.ts, useAttributeMutations.ts,
    │   │   useRelationMutations.ts, usePuntosControlArrastre.ts
    │   ├── lib/floatingEdge.ts, relationPath.ts, relationCrossing.ts (algoritmo AABB), controlPoints.ts
    │   └── pages/DiagramEditorPage.tsx       # Thin Page del lienzo UML en modo oscuro
    │
    ├── tasks/                                # 📋 Tablero Kanban de Tareas
    │   ├── api/tasksApi.ts, components/create-task-dialog/, components/task-card/
    │   ├── hooks/useTasks.ts (sincronización reactiva sin recargar), useTaskMutations.ts
    │   └── pages/ProjectTasksPage.tsx        # Kanban en 3 columnas (Pendiente, En Proceso, Completada)
    │
    ├── notes/                                # 📝 Bitácora de Decisiones Arquitectónicas (ADRs)
    │   ├── api/notesApi.ts, components/create-note-dialog/, components/note-item/
    │   ├── hooks/useNotes.ts (sincronización reactiva en tiempo real), useNoteMutations.ts
    │   └── pages/ProjectNotesPage.tsx        # Timeline cronológico de notas de diseño
    │
    ├── xmi/                                  # 🔄 Interoperabilidad con Enterprise Architect
    │   ├── api/xmiApi.ts, components/xmi-import-dialog.tsx, hooks/useXmiExchange.ts
    │   └── pages/ProjectXmiPage.tsx          # Exportación (.xmi 1.1 EA) e importación de modelos
    │
    ├── generator/                            # ⚡ Generador de Backend Spring Boot Client-Side
    │   ├── components/generator-file-tree.tsx, generator-code-viewer.tsx
    │   ├── hooks/useProjectGenerator.ts
    │   ├── lib/springBootGenerator.ts        # Motor TypeScript: Model JPA, DTOs con FKs, Services con inyección foránea, Controllers y OpenAPI
    │   ├── lib/zipExporter.ts                # Empaquetado binario cliente y descarga ZIP inmediata
    │   └── pages/ProjectGeneratorPage.tsx    # Explorador de código, visor reactivo y descarga .ZIP
    │
    ├── copilot/                              # 🤖 Asistente Autónomo Copilot & Visión Híbrida IA
    │   ├── components/copilot-panel.tsx, copilot-header.tsx, copilot-input.tsx, copilot-image-attach.tsx
    │   ├── components/copilot-message-list.tsx, copilot-message-item.tsx, copilot-card-list.tsx
    │   ├── components/tarjetas/              # Tarjetas interactivas (entidad, relación, ADR, tarea, atributo)
    │   ├── hooks/useCopilot.ts, usePanelResize.ts, useCopilotActionHandlers.ts
    │   └── lib/geminiService.ts (Router: DeepSeek texto / Gemini fotos), geminiVisionService.ts,
    │       copilotImageUtils.ts (compresión canvas), copilotBatchExecutor.ts, copilotKnowledge.ts
    │
    ├── collaboration/                        # 👥 Colaboración en Tiempo Real (Presencia & Cursores)
    │   ├── api/collaborationApi.ts
    │   ├── components/collaborator-presence-bar.tsx, remote-cursors-layer.tsx
    │   ├── hooks/useRealtimeCollaboration.ts (canal híbrido BroadcastChannel + HTTP Backend),
    │   │   useHttpPresence.ts, useDiagramPolling.ts (auto-detección silenciosa de mutaciones)
    │   └── lib/collaborationUtils.ts
    │
    └── voice/                                # 🎙️ Reconocimiento de Voz & Push-to-Talk
        ├── components/voice-mic-button.tsx, voice-push-to-talk-hud.tsx (HUD fluido para celular)
        └── hooks/useSpeechRecognition.ts (Web Speech API), usePushToTalk.ts (Modo Walkie-Talkie)
```

---

## 📐 3. Principios y Convenciones de Arquitectura

1. **Regla Anti-1k-Lines (Límite estricto de líneas):**
   - Ningún archivo de código debe exceder las **150 líneas**. Todo componente grande debe dividirse en subcomponentes, custom hooks (`use*.ts`) o configuraciones (`*.data.ts`).
   - Las páginas en `pages/` son "Thin Pages": orquestan el layout sin incluir lógica pesada ni llamadas `fetch` directas.

2. **Diseño Responsivo Inteligente:**
   - **En escritorio (`>= 768px`):** El panel Copilot está acoplado lateralmente a la derecha y permite redimensionar su ancho arrastrando el divisor.
   - **En celulares y tablets (`< 768px`):** Inicia cerrado por defecto. Al abrirse, se comporta como un **Drawer flotante deslizante (`fixed inset-y-0 right-0 z-50`) con fondo oscuro translúcido**, garantizando que el lienzo de diagramas no se aplaste ni se desborde.

3. **Prevención de Errores de API y Fallback:**
   - En [`lib/api.ts`](file:///home/lmc/projects/sw-case/case-frontend/src/lib/api.ts), `API_URL` utiliza fallback seguro a string vacío (`import.meta.env.VITE_API_URL ?? ""`), asegurando que en producción con Nginx las peticiones viajen de forma relativa hacia `/api/...` sin errores de CORS.

4. **Verificación de Compilación Obligatoria:**
   - Todo cambio en el frontend debe ser verificado ejecutando:
     ```bash
     npm run build
     ```
     asegurando 0 errores de TypeScript (`tsc -b`) y empaquetado de Vite.
5. **Cero Git Push:** NUNCA ejecutar `git push`. La sincronización remota corresponde al usuario.
