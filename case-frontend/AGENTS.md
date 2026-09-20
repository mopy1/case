# CASE Frontend — Arquitectura, Guía de Diseño y Árbol Proyectado

Este documento define la arquitectura técnica, los patrones de diseño y la estructura completa de carpetas de `case-frontend` para el desarrollo del proyecto **CASE Tool** (Ingeniería de Software). Es la fuente de verdad exclusiva del frontend — el `AGENTS.md` de la raíz del repo solo enlaza para acá.

Cualquier agente IA o desarrollador que trabaje en esta base de código **DEBE** seguir estas directrices de forma obligatoria.

## ✅ Estado real construido (2026-09-07/08, sesión/colaboradores 2026-09-11, diagrama 2026-09-11/16)

El árbol de la sección 2 de abajo es el **proyectado** (plan completo). Lo que existe de verdad
hoy, funcional y probado contra el backend real:

- **Sesión y rutas (2026-09-11):** `routes/ProtectedRoute.tsx` (exige token, si no `/login`) y
  `routes/GuestRoute.tsx` (si ya hay token, `/login`/`/register` redirigen a `/proyectos`) —
  envuelven las rutas en `App.tsx`. `/` ya no muestra una página "Hola": redirige según haya o no
  token (`pages/Home.tsx` se borró, no hacía falta). `useAuth.ts` sigue leyendo `localStorage`
  directo (sin `AuthContext`, no hizo falta con el volumen actual de la app).
- **`lib/api.ts` → `apiFetch()` (2026-09-11):** interceptor de JWT que faltaba — agrega el Bearer
  token automático y, ante un **401** del backend, limpia `localStorage` y manda a `/login`. Todos
  los `*Api.ts` (`projectsApi`, `tasksApi`, `notesApi`) se migraron a usarlo, sacando la
  duplicación de `authHeaders()`/`fetch` manual que tenía cada uno. `authApi.ts` (login/register)
  se queda con `fetch` directo a propósito, no hay token todavía en esas dos llamadas.
- **Logout real (2026-09-11):** antes `useAuth().logout()` existía pero no lo llamaba nada en la
  UI. Ahora hay un `DropdownMenu` con "Cerrar sesión" en el avatar del usuario, tanto en
  `ProjectsDashboardPage` como en `ProjectNavRail`.
- **`components/common/project-members-dialog/` → `ProjectMembersDialog` (2026-09-11):** el
  backend ya tenía agregar/cambiar rol/quitar colaboradores completo, pero no existía ninguna UI
  para usarlo. Botón "Colaboradores" nuevo en `ProjectNavRail`. ADMIN ve formulario de agregar
  (usuario/email + rol) y puede cambiar rol/quitar a cualquiera; `COLABORADOR`/`LECTOR` ven la
  lista en solo lectura. Requirió agregar `changeMemberRole`/`removeMember` a `projectsApi.ts`
  y un hook nuevo `useMemberMutations.ts`. (Nombrado en español al principio —
  `cambiarRolMiembro`/`eliminarMiembro`/`agregarMiembro`/`miembrosProject` — corregido a inglés el
  mismo día para no romper la convención de `tasksApi`/`notesApi`.)
- **`components/common/ConfirmDialog.tsx` (2026-09-11):** genérico, reusa `Dialog` de shadcn.
  Usado en "eliminar tarea" y "quitar colaborador" — antes ambos borraban en un solo click sin
  confirmación. Soporta anidarse dentro de otro `Dialog` (verificado: quitar un colaborador desde
  `ProjectMembersDialog` abre el confirm por encima sin romper el diálogo padre).
- **Bug real corregido (2026-09-11):** `ProyectoResponse` en `projects.type.ts` tenía el campo
  `rol`, pero el backend siempre devolvió `miRol` (ver `ProyectoResponse.java` del backend) — nadie
  lo había notado porque nada leía ese campo hasta que `ProjectLayout` necesitó saber el rol actual
  para mostrar u ocultar los controles de ADMIN en `ProjectMembersDialog`.
- `features/auth/` completo (login/register).
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
  fuera de alcance. **Fix real (2026-09-11):** el avatar superpuesto de la esquina quedaba
  literalmente encima del botón `ChevronRight` del footer — se agregó `pr-8` condicional al
  `CardFooter` cuando la tarea tiene asignado, para que no se solapen.
- **`features/notes/`** (nuevo, completo) — feed tipo timeline, crear nota (acción + motivo).
  Las notas **no se pueden borrar** (a propósito, son un registro histórico de decisiones — ver
  `NotaProyectoController`, solo tiene `POST`/`GET`).
- **Espaciado de diálogos (2026-09-11):** `CreateProjectDialog`/`CreateTaskDialog`/
  `CreateNoteDialog` envuelven header+campos+footer en un solo `<form>` sin gap propio — con
  descripciones de una línea casi no se notaba, pero en "Nueva nota" (dos líneas) el primer campo
  quedaba pegado al texto de arriba. Se agregó `className="flex flex-col gap-6"` al `<form>` de
  los tres. Los tres formularios también hacen `.trim()` de los campos de texto antes de mandarlos
  (se encontró una descripción de proyecto guardada con un `\n` final por no recortar el textarea).
- **`features/xmi/` — Fase 3 completa (2026-09-20, pedido explícito: "para el xmi ahora
  integralo ya toca").** Ver más abajo el detalle completo — dejó de ser el placeholder original
  (nacido junto con `features/generator/`, que sigue siendo placeholder porque el backend no
  tiene Fase 4 construida todavía).
- **`features/generator/`** (placeholder, sin cambios) — el backend no tiene Fase 4 (generador)
  construida todavía, la página es un `Empty` con "próximamente" y botón `disabled` — nada de
  funcionalidad simulada. Ya deja anotado en el copy que **solo genera Spring Boot**, sin
  selector de otro framework.
- **`src/hooks/useAuth.ts`** (nuevo) — lee `user`/`token` de `localStorage`, expone `logout()`.
- **`features/diagram/` — Fase 2 completa (arrancada 2026-09-11, terminada 2026-09-16):**
  `@xyflow/react` instalado. `DiagramEditorPage` — lienzo con zoom/fit (`Controls`), grilla
  punteada (`Background`), botón "+ Entidad" (`CanvasToolbar`) que abre un diálogo para nombrar la
  tabla y la crea contra `POST /api/proyectos/{id}/entidades`. `EntityNode` (nodo custom) — header
  con nombre + badge "TABLE" + borrar (`ConfirmDialog`, con clase `nodrag` para no arrastrar el
  nodo al hacer click), cuerpo con los atributos (PK/FK/tipo) de solo lectura, y dos `Handle`
  (`target` izquierda / `source` derecha) para trazar relaciones arrastrando entre tablas.
  Arrastrar una tabla persiste su posición vía `PUT .../entidades/{id}` en `onNodeDragStop`. Ruta
  `diagrama` habilitada en `App.tsx` y en `project-nav-rail.data.ts` (`disabled: false`); el
  `index` de `/proyectos/:id` redirige a `diagrama`. **Fix de tema:** React Flow trae su
  `Controls`/atribución con fondo blanco por default — no combina con el tema oscuro, se
  sobreescribió en `index.css` (`.react-flow__controls-button`, `.react-flow__attribution`,
  `.react-flow__handle`).
  - **2.2 Atributos (2026-09-16):** `components/panel/entity-properties-panel/` — panel lateral
    flotante que aparece al seleccionar una tabla (`onNodeClick`/`onPaneClick` en
    `useDiagramCanvas`), con formulario de rename inline (llama a `useEntityMutations().update`
    con la posición actual sin cambiar) y la lista de atributos (badges PK/FK + tipo, editar/
    borrar por fila). `attribute-form-dialog.tsx` — un solo diálogo para crear y editar (el modo
    lo decide si recibe `atributo`), con `Select` de tipos SQL comunes (`VARCHAR`/`INTEGER`/etc.),
    `Checkbox` de `esPk`/`esFk`/`nullable` (componentes shadcn nuevos, instalados con
    `npx shadcn@latest add checkbox switch`) y, si `esFk`, un `Select` de "Referencia a" con las
    demás entidades del proyecto (excluye la propia). `useAttributeMutations(proyectoId,
    entidadId)` — mismo patrón `run()`/`create`/`update`/`remove` que `useEntityMutations`.
  - **2.3 Relaciones (2026-09-16):** conectar el handle `source` de una tabla con el `target` de
    otra dispara `onConnect` en `useDiagramCanvas`, que guarda la conexión pendiente y abre
    `edges/relation-type-dialog.tsx` (`Select` de `UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS`) —
    recién al confirmar se llama `POST /api/proyectos/{id}/relaciones`. `edges/UmlRelationEdge.tsx`
    — arista custom con flecha (`MarkerType.ArrowClosed`), label de tipo ("1 : 1"/"1 : N"/"N : M")
    vía `EdgeLabelRenderer` y botón de borrado con `ConfirmDialog`. `useRelationMutations` —
    `create`/`remove`. **Bug real encontrado y corregido:** el label de la arista no reaccionaba
    a clicks — `.react-flow__edgelabel-renderer` trae `pointer-events: none` por defecto en el CSS
    de React Flow (para no bloquear el canvas), así que el div del label necesita
    `pointer-events-auto` explícito o el click atraviesa al path de la arista de abajo.
  - **Multiplicidad por extremo + tabla intermedia automática (2026-09-19, pedido explícito):**
    `UmlRelationEdge` ahora también dibuja la cardinalidad de cada lado ("1"/"1..*"/"*..*" según
    `TipoRelacion`, tabla `MULTIPLICIDADES`) cerca de cada punta de la arista, no solo el label
    del medio. Posición calculada a una distancia **fija** de cada punta (`Math.min(40, largo/2-4)`),
    no un porcentaje del largo — con un % el label quedaba tapado por el pill del medio en
    relaciones cortas (bug real encontrado probando). Por la misma razón se amplió el espaciado
    automático de `handleCreate` (`useDiagramCanvas`) de 360/280 a 440/300 px, para que el pill +
    las 2 multiplicidades entren sin superponerse en tablas recién creadas por el toolbar
    (tablas arrastradas muy juntas a mano igual pueden verse apretadas — al usuario le queda
    arrastrarlas más separadas). **N:M ahora crea tabla intermedia sola** — es lógica 100%
    backend (`RelacionDiagramaService`, ver `case-backend/AGENTS.md`), el frontend no hizo nada
    especial: el `refetch()` que ya corría tras crear una relación simplemente trae la entidad y
    las 2 relaciones físicas nuevas en la misma respuesta del lienzo.
  - **Notación "clase de asociación" para la tabla intermedia (2026-09-19, pedido explícito):**
    las 2 relaciones físicas UNO_A_MUCHOS de la tabla intermedia ya NO se dibujan como aristas
    sueltas tocando cada entidad — se detectan (`detectarAsociacionesClase` en `useDiagramCanvas`,
    heurística: relación N:M entre A/B + una entidad J con un 1:N desde A y otro desde B hacia
    ella) y se excluyen de `edges`; en su lugar, `edges/AssociationClassOverlay.tsx` dibuja **una
    sola línea punteada** desde el punto medio de la relación N:M hasta J, estilo UML real (clase
    de asociación). Implementado con `ViewportPortal` + `useInternalNode` (ambos de
    `@xyflow/react`) en vez de una arista común — `useInternalNode` da posición/tamaño medido en
    vivo de cualquier nodo por id, así la línea se recalcula sola cuando se arrastra A, B o J, sin
    necesitar un nodo virtual sincronizado a mano. Borrar la línea punteada (botón propio,
    `ConfirmDialog`) borra las 2 relaciones físicas vía `onDeleteAsociacion`, pero **no** toca la
    tabla intermedia en sí — queda como tabla independiente.
  - **Diálogo de relación: multiplicidad en vez de "tipo" (2026-09-19, pedido explícito):**
    `relation-type-dialog.tsx` ya no pide elegir `TipoRelacion` (`UNO_A_UNO`/`UNO_A_MUCHOS`/
    `MUCHOS_A_MUCHOS`) — pide la **multiplicidad** directa, con un cuarto valor nuevo
    `Multiplicidad` (`diagram.types.ts`) que agrega `MUCHOS_A_UNO`: mismo `UNO_A_MUCHOS` del
    backend, pero con origen/destino invertidos. Sin esto, si el usuario arrastraba la conexión
    del lado "N" hacia el lado "1", no había forma de decirlo sin deshacer y rearrastrar al revés.
    `useDiagramCanvas.handleConfirmRelation` resuelve la inversión antes de llamar a la API — el
    backend sigue sin saber nada de "N:1", solo ve `UNO_A_MUCHOS` con los ids ya en el orden
    correcto.
  - **Multiplicidad completa (0/1/N) + editar relación clickeando (2026-09-19, pedido
    explícito):** default cambiado a `UNO_A_UNO` (antes `UNO_A_MUCHOS`). El diálogo ahora también
    tiene 2 checkboxes ("¿[tabla] es opcional?") que van a `opcionalOrigen`/`opcionalDestino` del
    backend — combinados con el tope 1/N de `tipoRelacion`, dan las 4 multiplicidades reales
    (`1`, `0..1`, `1..*`, `0..*`) que `UmlRelationEdge` calcula por lado (`etiquetaMultiplicidad`).
    Los dos textos de multiplicidad en el lienzo dejaron de ser `<div>` sin interacción — son
    `<button>` (`onClick` → `onEdit`) que abren el mismo diálogo en modo edición (`initial` con
    los valores actuales) y llaman a `PUT .../relaciones/{id}` en vez de `POST`.
    `useDiagramCanvas` unifica todo en un solo objeto `relationDialog` (armado según haya
    `pendingConnection` o `editingRelacion` activo) que la página solo spreadea en
    `<RelationTypeDialog {...relationDialog} .../>` — evita si/si en la página y mantiene la
    regla de páginas delgadas. **Limitación conocida, no arreglada a propósito:** los botones de
    multiplicidad pueden quedar detrás de un nodo si dos tablas están muy juntas (mismo problema
    de superposición que el label del medio, ver más abajo) — mover las tablas lo resuelve.
  - **Sin diálogo ni pill del medio — solo "(mult)" en cada punta, editable por lado (2026-09-19,
    pedido explícito):** pedido textual: *"[tabla1](1..\*)----------(1..\*)[tabla2], solo quiero
    que se muestre así [...] no quiero lo que hay en medio de la línea, quiero únicamente
    modificar los bordes, es decir los ()"*. Se borró `relation-type-dialog.tsx` entero — ya no
    existe un diálogo de relación. `UmlRelationEdge` quedó reducida a `<BaseEdge>` (línea + flecha,
    sin cambios) más 2 `<DropdownMenuTrigger>` con el texto entre paréntesis (`(1)`, `(0..1)`,
    `(1..*)`, `(0..*)`) — el pill central con `ETIQUETAS[tipoRelacion]` y el botón de borrar que
    tenía adentro desaparecieron sin reemplazo visual. Cada paréntesis es independiente: al
    clickearlo se abre un `DropdownMenu` con las 4 multiplicidades posibles **solo para ese lado**
    — el otro lado no se toca. La lógica de conversión (lado independiente ↔ `TipoRelacion` +
    `opcionalOrigen`/`opcionalDestino` del backend, con inversión de origen/destino si el lado
    "uno" termina siendo el destino) se extrajo a `lib/multiplicidad.ts` (nuevo, reemplaza el tipo
    `Multiplicidad`/`MultiplicidadFormData` de `diagram.types.ts` por `LadoMultiplicidad`). Al
    conectar dos tablas arrastrando ya no aparece ningún diálogo — la relación nace `UNO_A_UNO`
    directo (mismo default de antes) y cada lado se ajusta después clickeando su paréntesis,
    incluso hasta llegar a N:M editando cada punta por separado (ver más abajo, cambio de
    `actualizar()` en el backend). **Borrar relación:** sin el botón del pill ya no hay UI propia
    para esto — se usa el mecanismo nativo de React Flow: seleccionar la línea (click en el trazo,
    no en un paréntesis) y apretar Supr/Backspace (`deleteKeyCode={["Backspace","Delete"]}` en
    `<ReactFlow>`). `useDiagramCanvas` intercepta los `EdgeChange` de tipo `"remove"` en un wrapper
    (`handleEdgesChange`) para persistir el borrado contra el backend — React Flow ya sacó la
    arista de su estado local antes de que el wrapper se entere, así que solo hace falta llamar a
    la API y `refetch()`. La línea punteada de "clase de asociación" (`AssociationClassOverlay`,
    ver arriba) **no se tocó** — sigue con su propio botón de borrar en la línea punteada, pedido
    explícito de dejarla "como antes".
  - **Se cae la capa de conversión — el backend ahora guarda cada lado directo (2026-09-19,
    pedido explícito del usuario cuestionando el diseño):** la nota de arriba mencionaba
    `lib/multiplicidad.ts` traduciendo "lado independiente" ↔ `tipoRelacion`+`opcionalOrigen`/
    `opcionalDestino`, con inversión de origen/destino incluida. El usuario preguntó por qué no
    ahorrarse toda esa traducción guardando `multiplicidadOrigen`/`multiplicidadDestino`
    directo — tenía razón, así que el backend cambió (ver "Modelo de multiplicidad simplificado"
    en `case-backend/AGENTS.md`, incluye la migración real de datos que hizo falta). Con esto:
    - `RelacionDiagramaResponse`/`RelacionDiagramaRequest` (`diagram.types.ts`) ya no tienen
      `tipoRelacion`/`opcionalOrigen`/`opcionalDestino` — tienen `multiplicidadOrigen`/
      `multiplicidadDestino: LadoMultiplicidad` directo, mismo tipo que antes solo existía en el
      frontend.
    - `lib/multiplicidad.ts` quedó reducido a dos helpers puros sin estado ni conversión:
      `etiquetaLado()` (texto a mostrar) y `esMuchosAMuchos(origen, destino)` (para
      `detectarAsociacionesClase`). Ya no existen `ladoOrigen`/`ladoDestino`/`resolverDesdeLados`
      ni la tabla `TOPE_UNO`.
    - `UmlRelationEdge` lee `relacion.multiplicidadOrigen`/`multiplicidadDestino` directo, sin
      derivarlos de nada.
    - `useDiagramCanvas.handleEditLado` ya no invierte origen/destino — solo cambia el lado que
      se tocó y manda el otro tal cual venía. **Efecto visible:** la arista ya no cambia de
      dirección en el lienzo al editar un lado (antes sí, era el síntoma que hizo notar la
      complejidad de más).
  - **Resaltado al seleccionar + botón de borrar arriba de la línea (2026-09-19):** sacar el pill
    del medio (nota de arriba) dejó el borrado sin ninguna pista visual — el usuario probó el
    lienzo y no encontró cómo borrar una relación, aunque el mecanismo (seleccionar + Supr/
    Backspace) andaba bien. `UmlRelationEdge` lee el prop `selected` de `EdgeProps`: si está
    seleccionada, el `<BaseEdge>` cambia a `stroke: var(--destructive)` + más grosor. Primera
    iteración fue un tooltip de solo texto ("Supr para borrar") en el punto medio, pero tapaba la
    línea — reemplazado por un botón de basurero real (`ConfirmDialog`, mismo patrón que el resto
    del proyecto) offseteado **arriba** del punto medio (`labelY - 26`, no en el punto exacto)
    para no solaparse con la línea ni con el label `(1)` que puede estar cerca. Solo aparece
    mientras la relación está seleccionada, no es un elemento fijo como el pill viejo — y
    Supr/Backspace se queda andando igual como atajo directo, sin pasar por el botón.
  - **Bug real corregido: no se podían crear relaciones recursivas (2026-09-19):** `useDiagramCanvas.handleConnect` bloqueaba a propósito conectar una tabla consigo misma
    (`connection.source === connection.target`) — un resabio de una sesión anterior, sin ninguna
    razón real: una relación recursiva (ej. `empleado.jefe_id → empleado.id`, jerarquías,
    categorías con padre, etc.) es un patrón UML válido y el backend nunca la prohibió. Sacado el
    guard. Efecto en `UmlRelationEdge`: cuando `entidadOrigenId === entidadDestinoId`,
    `getBezierPath` traza casi una línea recta entre las 2 puntas del mismo nodo (derecha/
    izquierda), que queda invisible por debajo de la tarjeta — se detecta ese caso (`esRecursiva`)
    y se arma un path manual (`M ... C ...`) que bordea el nodo por abajo en forma de lazo, con
    las 2 multiplicidades a los costados del lazo en vez de sobre la línea recta. También se
    corrigió `detectarAsociacionesClase`: si la N:M es recursiva, las 2 relaciones físicas hacia
    la tabla intermedia tienen el mismo `entidadOrigenId` — el `.find()` viejo devolvía la MISMA
    fila para `relOrigen` y `relDestino`; ahora se filtran candidatas por `entidadDestinoId ===
    junction.id` primero y se excluye explícitamente la ya asignada a `relOrigen` al buscar
    `relDestino`. Ver `case-backend/AGENTS.md` para el fix correspondiente de nombres de columna
    FK duplicados en `crearTablaIntermedia`.
  - **Líneas ortogonales en vez de bezier (2026-09-19, pedido explícito — "muy tosca las
    relaciones... que se acomoden solas"):** `UmlRelationEdge` cambió de `getBezierPath` a
    `getSmoothStepPath` (ambos de `@xyflow/react`) para el caso no recursivo — ángulos de 90°
    en vez de curvas, y la ruta se recalcula sola según la posición de los nodos, sin quedar
    colgando en diagonal. El offset de las 2 multiplicidades también cambió: con la bezier se
    proyectaban en línea recta hacia la otra punta (`dx/dy` normalizado); con la ortogonal eso
    las dejaba fuera del trazo real en cuanto había un giro, así que ahora van sobre el tramo
    horizontal fijo que sale de cada handle (los handles de `EntityNode` son siempre Right/Left,
    ese primer/último tramo es siempre horizontal). **Alternativa evaluada y descartada por
    pedido explícito:** líneas rectas editables a mano con puntos de quiebre (estilo Enterprise
    Architect/Visio, Alt+drag para agregar un punto) — no es nada que traiga React Flow de
    fábrica, habría que guardar una lista de waypoints por relación (campo nuevo en el backend) y
    construir un editor de path custom; se descartó por ahora, `getSmoothStepPath` solo ya
    resuelve el pedido de "que se acomoden solas".
  - **Lazo recursivo: rectangular y por arriba, no una curva por abajo (2026-09-19, pedido
    explícito — "que sea recta que no dé vuelta y que sea más alejado, que pase por arriba y no
    por abajo"):** el lazo curvo (`C`, bordeando por abajo) de la nota anterior se reemplazó por
    un path de solo líneas rectas (`L`, ángulos de 90°) que sale del handle derecho, sube por
    arriba de la tarjeta, cruza, y baja al handle izquierdo. La altura a la que sube no es un
    valor fijo a ojo — usa `useInternalNode(String(relacion.entidadOrigenId))` (mismo hook que ya
    usa `AssociationClassOverlay`) para leer `measured.height` real del nodo y calcular el borde
    superior + un margen de 50px, así una tabla con muchos atributos (más alta) no queda tapada
    por el lazo.
  - **Bug real corregido: la línea punteada de la tabla intermedia atravesaba las tablas
    (2026-09-19, pedido explícito — "las relaciones intermedias... traspasan las líneas
    punteadas a las tablas"):** `AssociationClassOverlay` calculaba su punto de partida como el
    promedio crudo de los centros de origen/destino (`(origen.x+destino.x)/2`), sin ninguna
    relación con el trazo visible real de la línea N:M — con la ortogonal (smoothstep, ver más
    arriba) ese promedio casi nunca cae sobre la línea de verdad, y encima el punto de llegada al
    junction era su centro geométrico salvo un caso (`junction.topY < medioY`) mal resuelto, que
    hacía que la línea terminara adentro de la tabla en vez de en su borde. Reescrito: el punto de
    partida ahora se calcula con el mismo `getSmoothStepPath` que usa `UmlRelationEdge` (mismos
    handles Right/Left), así arranca exactamente del punto visible de la línea N:M; el punto de
    llegada usa `puntoDeEntrada()` (nuevo helper) que elige el borde más cercano de la tabla
    intermedia (arriba/abajo/izquierda/derecha según de qué lado viene) en vez de su centro, y la
    línea se traza en dos tramos rectos (vertical + horizontal) en vez de una diagonal. **Límite
    conocido, no resuelto a propósito:** si una tercera tabla cualquiera queda posicionada justo
    en el medio de ese tramo recto, la línea la va a cruzar igual — esto no es ruteo con evasión
    de obstáculos (fuera de alcance, ver la nota de líneas rectas editables más arriba, mismo
    motivo), solo corrige que la línea entre bien a la tabla intermedia y no salga de cualquier
    lado.
  - **Ajuste de layout:** el espaciado automático de `handleCreate` (columnas de nuevas tablas) se
    amplió de 280/240 a 360/280 px — con el ancho real de `EntityNode` (256px) el espaciado viejo
    dejaba solo ~24px libres entre dos tablas contiguas, sin lugar para el label de la relación.
  - **Pendiente, fuera de alcance por ahora:** deshacer/rehacer (`useDiagramHistory.ts`), atajos
    de teclado (`useCanvasShortcuts.ts`) — ver Plan de Trabajo.md, no bloquean Fase 3/4.
  - **Tanda de mejoras visuales "que parezca un diagrama de base de datos de verdad"
    (2026-09-19, pedido explícito, lista completa pedida y aprobada por el usuario):**
    - **`EntityNode` con ícono de llave/cadena en vez de badges de texto:** `KeyRound` (lucide)
      para PK, `Link2` para FK, cada uno con `Tooltip` (`Clave primaria` / `Llave foránea → tabla`)
      — es el símbolo más reconocible de un diagrama ER, antes era solo texto "PK"/"FK".
    - **Separador entre PK y el resto de columnas:** los atributos se reordenan (PK primero, un
      `<Separator/>` después si hay de los dos grupos) — antes salían en el orden que devolvía el
      backend, sin agrupar.
    - **Indicador de `nullable`:** un ícono `Circle` (hueco = admite NULL, relleno = NOT NULL) con
      tooltip — antes esa info no se veía en el lienzo, solo en el panel de atributos.
    - **Zebra striping y tooltips de texto completo:** filas de atributo alternadas
      (`bg-muted/30` en las impares) y `title=` nativo en nombre/tipo — la tarjeta sigue truncando
      texto largo (`w-64` fijo, no se redimensiona sola) pero ahora el nombre completo se ve al
      pasar el mouse.
    - **Tablas intermedia auto-generadas distinguidas visualmente:** borde punteado + badge "auto"
      con tooltip, calculado con el mismo `idsTablaIntermedia` (derivado de `asociaciones`) que ya
      usaba `detectarAsociacionesClase` — antes una tabla creada sola por una N:M se veía
      idéntica a una creada a mano, fácil de confundir.
    - **Handles (los puntos de conexión) solo visibles al pasar el mouse por la tabla**
      (`index.css`, `opacity: 0` + `.react-flow__node:hover .react-flow__handle`) — antes estaban
      siempre visibles en las 4 puntas de cada tabla, ensuciando bastante con varias tablas en
      pantalla. Es CSS puro, no afecta que se puedan seguir arrastrando para conectar (el
      `opacity` no cambia el hit-test del puntero).
    - **Notación "pata de gallo" (crow's foot) — probada y sacada el mismo día, pedido
      explícito.** Se había agregado `edges/relation-markers.tsx` con 4 `<marker>` SVG (uno por
      `LadoMultiplicidad`) reemplazando la flecha genérica (`MarkerType.ArrowClosed`) por símbolos
      tick/círculo/horquilla en las puntas de la línea. El usuario lo probó y pidió sacarlo —
      **"quiertar lo que llamas pata de gallo, y que se vean solo las multiplicidad"**. Se borró
      `relation-markers.tsx` entero, `<RelationMarkers/>` de `DiagramEditorPage`, y
      `markerStart`/`markerEnd` de `<BaseEdge>` en `UmlRelationEdge` — la línea volvió a ser
      simple (sin flecha, sin marcador), y el texto entre paréntesis en cada punta (`(1)`/
      `(1..*)`/etc., ver más arriba) quedó como única señal de multiplicidad.
    - **Resaltar todas las relaciones de una tabla al seleccionarla:** cada arista recibe un
      `resaltada: boolean` en su `data` (calculado en el efecto que arma `edges`, ahora también
      depende de `selectedEntidadId`) — si es `true` y la arista no está además click-seleccionada
      para borrar, el trazo pasa a `var(--primary)` en vez del color default. Mismo tratamiento en
      `AssociationClassOverlay` (la línea punteada de la tabla intermedia también se resalta si la
      tabla seleccionada es el origen, el destino o la propia tabla intermedia).
    - **Auto-organizar — probado y sacado el mismo día (2026-09-20, pedido explícito: "ya
      innecesario el botón de auto organizar, quítalo").** Se había agregado con `@dagrejs/dagre`
      (`lib/autoLayout.ts`) para acomodar las tablas en capas. Una vez que las relaciones pasaron
      a "flotar" y engancharse solas al lado más cercano (ver más abajo), dejó de hacer falta —
      ya no importa tanto en qué posición relativa quedan las tablas. Se borró `lib/autoLayout.ts`,
      el botón de `CanvasToolbar`, `handleAutoLayout`/`onAutoLayout` de `useDiagramCanvas`, y la
      dependencia `@dagrejs/dagre` (`npm uninstall`).
    - **Minimapa:** `<MiniMap/>` de `@xyflow/react` agregado dentro de `<ReactFlow>`, con
      `nodeColor`/`maskColor` a tono con el resto del tema oscuro (mismo criterio que ya se usó
      para `Controls`/atribución).
    - **Descartado a propósito: modo claro.** El usuario lo sugirió junto con el resto, pero el
      modo oscuro forzado es una decisión ya tomada a nivel de toda la app (ver sección "Stack",
      más abajo), no algo específico del diagrama — cambiarlo ahora afectaría login, dashboard de
      proyectos, etc., bastante más allá de "que el diagrama se vea mejor". Se avisó explícitamente
      y quedó pendiente para pedirse aparte si hace falta. Confirmado (2026-09-20): el usuario
      pidió seguir en oscuro nomás.
  - **"Floating edges" — el punto de enganche ya no es siempre el mismo lado fijo (2026-09-20,
    pedido explícito: "quiero que el punto de donde sale o de donde entra sea de toda la tabla...
    que lo pueda mover libremente... que pueda pegarlo en cualquier parte de la tabla"):** antes
    toda relación salía siempre del lado derecho del origen y entraba siempre por el izquierdo del
    destino (2 handles fijos por tabla), sin importar si la otra tabla en realidad estaba arriba,
    abajo o al costado — obligaba a acomodar las tablas a mano solo para que las líneas no
    quedaran feas. React Flow no deja "arrastrar" el punto de enganche a un pixel arbitrario del
    borde (necesita handles reales para iniciar una conexión), así que se implementó la técnica
    que la propia documentación de React Flow recomienda para esto — "floating edges":
    - **`EntityNode`:** 4 `Handle` (uno por lado: `top`/`right`/`bottom`/`left`, todos
      `type="source"`) en vez de los 2 fijos (`target` izquierda, `source` derecha) de antes — con
      esto ya se puede arrancar o terminar una conexión desde cualquiera de los 4 lados.
    - **`lib/floatingEdge.ts`** (nuevo): `calcularParametrosArista(origen, destino)` calcula en
      cada render el punto exacto donde el segmento entre los centros de ambas tablas cruza el
      rectángulo de cada una (aproximado sobre la elipse inscripta — la fórmula estándar de este
      patrón) y de qué lado cayó ese punto (`Position.Top/Right/Bottom/Left`). El resultado: el
      punto de enganche puede terminar en cualquier parte del borde, no solo en 4 posiciones fijas,
      y se recalcula solo cada vez que se arrastra una tabla — sin que el usuario tenga que tocar
      nada. `offsetDesdePosicion()` da el desplazamiento perpendicular para plantar el paréntesis
      de multiplicidad justo afuera del borde, sea cual sea el lado.
    - **`UmlRelationEdge`:** ya no usa `sourceX`/`sourceY`/`sourcePosition`/etc. de `EdgeProps`
      (asumían un handle fijo) — llama a `useInternalNode` para origen Y destino y arma todo con
      `calcularParametrosArista` + `getSmoothStepPath` (para el caso no recursivo). El lazo de las
      relaciones recursivas se mantiene igual (un "floating edge" no tiene sentido cuando origen y
      destino son el mismo rectángulo).
    - **`AssociationClassOverlay`:** el punto de partida de la línea punteada hacia la tabla
      intermedia usa el mismo `calcularParametrosArista` — si no, con la línea N:M ahora "flotando"
      a cualquier lado, ese punteado se hubiera desconectado del punto real de la línea.
    - **`useDiagramCanvas.relacionAArista`:** ya no fija `sourceHandle`/`targetHandle` — no tiene
      sentido con 4 handles por tabla, y `UmlRelationEdge` ignora esas coordenadas de todos modos.
    - **`<ReactFlow connectionMode={ConnectionMode.Loose}>`** (`DiagramEditorPage` — el valor
      original de este cambio era el string `"loose"`, corregido después por un error de tipos
      real, ver la nota de "Nota de proceso" más abajo) — **bug real encontrado probando esto:**
      el default de React Flow es `connectionMode="strict"`, que solo permite
      conectar un handle `source` con uno `target`. Antes andaba porque había exactamente un
      handle de cada tipo por tabla; con los 4 nuevos declarados `source`, una conexión
      source-a-source quedaba inválida en modo estricto y la conexión ni arrancaba (el drag se
      interpretaba como paneo del lienzo). En modo `loose` cualquier handle puede ser el arranque
      o la llegada — no afecta nada más de la app, la dirección real de la relación la define
      `multiplicidadOrigen`/`Destino`, no de qué handle salió.
    - **Límite real, no un bug:** esto no es "mover el punto a mano a cualquier pixel" — es
      recalculado automáticamente según la posición de las tablas. Es la aproximación más cercana
      a "que se pueda pegar en cualquier lado" que permite React Flow sin construir un sistema de
      puntos de conexión completamente custom (guardar una posición relativa por punta en el
      backend, dibujar manijas arrastrables sobre el borde, etc.) — bastante más trabajo para un
      resultado visualmente parecido en el 95% de los casos.
  - **Bug real corregido: la tabla intermedia de una N:M recursiva no se conectaba bien
    (2026-09-20):** `AssociationClassOverlay` calculaba el punto de partida de la línea punteada
    con `getSmoothStepPath({sourceX: origen..., targetX: destino...})` — pero para una N:M
    recursiva (`origenId === destinoId`) eso pasa `origen` y `destino` como el MISMO nodo, y
    `UmlRelationEdge` no dibuja ese caso con `getSmoothStepPath` en absoluto: dibuja un lazo
    rectangular manual que sale por arriba de la tarjeta (ver la nota de la N:M recursiva más
    arriba). El punteado arrancaba entonces de un punto que no tenía nada que ver con el lazo real
    — el "bug visual" reportado. Se agregó el mismo caso especial acá: si es recursiva, el punto
    de partida se calcula reproduciendo la fórmula exacta del lazo de `UmlRelationEdge` (mismo
    `margen`, mismo cálculo de `sourceX`/`targetX`/`loopY`) en vez de llamar a
    `getSmoothStepPath`. De paso, en el backend (`RelacionDiagramaService.crearTablaIntermedia`),
    la tabla intermedia de una N:M recursiva ya no se centra en X exactamente debajo del origen
    (`posX = origen.getPosX() + 350` en vez de promediar con destino, que da lo mismo que origen
    cuando son la misma entidad) — antes quedaba justo debajo del lazo, cruzándolo.
  - **Puntos de control arrastrables — agregados, sacados y vueltos a agregar el mismo día
    (2026-09-20).** Se construyó un sistema completo de puntos de control a mano (pedido inicial:
    *"quiero manipular las relaciones a libertad... que pasen por otro lado, estorba cuando pasa
    por encima de otra tabla"*) y se fue ajustando en varias rondas el mismo día — doble click
    para agregar → arrastrar la línea directo para agregar → requerir `Ctrl` para no romper la
    relación sin querer → `Ctrl`+click para quitar un punto → arreglar un parpadeo real en
    `useDiagram.ts` (`refetch()` prendía `loading` en cada mutación, no solo en la carga inicial).
    Después de esa ronda, el usuario pidió el enfoque de **dbdiagram.io** (anclaje automático a la
    fila exacta del atributo FK/PK, sin edición manual de puntos) y la feature completa se sacó.
    **Horas más tarde, pedido explícito "volver a como estabas antes nomas"** — el usuario
    prefería el sistema de puntos manuales al anclaje automático de dbdiagram.io — así que se
    **reconstruyó desde cero** (no había commits de git de por medio en ningún punto de este
    ida y vuelta, todo pasó dentro de la misma sesión sin commits intermedios, así que no hubo un
    simple `git revert` posible):
    - **`lib/relationPath.ts` (reescrito de vuelta):** `construirRutaRelacion(nodoOrigen,
      nodoDestino, puntosControl)` arma una polilínea recta — floating edge de `nodoOrigen` hacia
      el primer punto de control (o el centro de `nodoDestino` si no hay ninguno), una línea recta
      por cada punto intermedio, floating edge de `nodoDestino` hacia el último punto (o el centro
      de `nodoOrigen`). Sin puntos de control esto se reduce exactamente al floating edge simple de
      siempre — por eso `lib/floatingEdge.ts` no necesitó ningún cambio, `calcularParametrosAristaHaciaPunto`
      ya tenía la firma correcta (toma un punto externo arbitrario, no solo el centro de la otra
      tabla) para servir de base a esto. Ya no depende de `entidadOrigen`/`entidadDestino` ni de
      `screenToFlowPosition` (eso era solo para medir filas del DOM, ya no aplica).
    - **`components/edges/PuntoControlHandle.tsx` (recreado):** el círculo arrastrable —
      presentacional puro, un `div` vía `EdgeLabelRenderer` con área de agarre más grande
      (`size-5`) que el punto visible (`size-2.5`), toda la lógica de arrastre vive en
      `UmlRelationEdge`.
    - **`UmlRelationEdge` (reescrito de vuelta):** estado local `puntosLocal` (sincronizado desde
      `relacion.puntosControl` salvo mientras se está arrastrando, vía un ref de guardia) + un
      `<path>` invisible de `strokeWidth=20` superpuesto a la línea real, con `onPointerDown` que
      solo actúa si `e.ctrlKey` (si no, deja que el evento siga su curso normal — así clickear la
      línea sin `Ctrl` sigue seleccionando la arista como siempre). Arrastrar un punto existente
      NO necesita `Ctrl` (no hay ambigüedad posible en ese punto exacto); `Ctrl`+click (sin
      arrastre real — umbral de 4px de movimiento, `fueDragRef`) sobre un punto lo quita. El
      arrastre en sí es 100% local hasta soltar; recién en el `pointerup` se llama
      `onMoverPuntos()` (nuevo campo en `data`, viaja desde `useDiagramCanvas`) que persiste contra
      `PATCH .../puntos` y dispara el `refetch()` de siempre.
    - **`AssociationClassOverlay` (revertido):** vuelve a `useInternalNode` sin tipar (ya no hace
      falta leer `nodo.data.entidad`).
    - **`EntityNode.tsx`:** el `data-attributo-id={atributo.id}` que se había agregado para el
      anclaje a fila se sacó de vuelta — no le sirve a nada al sistema de puntos manuales.
    - **`diagram.types.ts`:** `PuntoControl` (`{x, y}`) y `puntosControl: PuntoControl[]` en
      `RelacionDiagramaResponse` de vuelta; `NodoEntidadData` (el tipo que existía solo para el
      anclaje a fila) se sacó por completo, ya no hace falta tipar `useInternalNode` en ningún
      lado del módulo.
    - **Verificado end-to-end vía Playwright (2026-09-20):** relación de prueba creada en el
      proyecto 16, `Ctrl`+arrastrar sobre la línea agrega un punto y persiste (`GET .../diagrama`
      confirmado), arrastrar el punto sin `Ctrl` lo mueve y persiste la nueva posición, `Ctrl`+click
      exacto sobre el punto lo borra (`puntosControl` vuelve a `[]`) — sin errores de consola en
      ningún paso. Todo el estado de prueba se limpió después, proyecto 16 confirmado de vuelta en
      su baseline exacto (5 entidades, 0 relaciones).
    - **Bug real corregido el mismo día (reportado: "en una relación que se hace 2 veces... hay una
      relación que es doble, y una tapa a la otra... quisiera moverla más a la izquierda o
      derecha", caso real en el proyecto 10):** cuando hay 2+ relaciones entre el MISMO par de
      entidades sin puntos de control propios, ambas calculan el floating edge exacto hacia el
      mismo centro de la otra tabla — quedan pixel a pixel una encima de la otra, sin nada
      distinguible para agarrar y separar a mano. `calcularOffsetsParalelos()` (nuevo, en
      `useDiagramCanvas.ts`) agrupa las relaciones no recursivas por par de entidades (clave
      `min(origenId,destinoId)-max(...)`), ignora las que ya tienen un punto propio (el usuario ya
      las resolvió), y a las que quedan sin resolver les asigna un offset perpendicular simétrico
      (`SEPARACION_PARALELA_PX = 40`, ej. 2 relaciones → -20/+20). `UmlRelationEdge` usa ese offset
      para sembrar un punto de control inicial (`puntoSeparacionInicial()`, punto medio entre los
      centros de ambas tablas corrido perpendicular a la línea que las une) — **no es una curva
      aparte ni un mecanismo nuevo**, es el mismo sistema de puntos arrastrables de siempre con un
      valor inicial razonable en vez de arrancar superpuestas. Si el usuario arrastra ese punto
      sembrado, se persiste igual que cualquier punto real (se "promueve" de sintético a real la
      primera vez que se toca); si no lo toca, se resiembra en cada `refetch()` sin persistir nada
      (guardado con `prev.length > 0` en el efecto de sync, para no perder un arrastre en curso ni
      recalcular de más). Verificado con 2 relaciones idénticas creadas a propósito entre las
      mismas 2 tablas del proyecto 16: antes del fix los dos `<path>` eran geométricamente
      idénticos; después, cada una arranca con su propio punto rojo visible y arrastrable, en lados
      opuestos de la línea recta original — capturado con screenshot real. Estado de prueba
      limpiado después (relaciones + las 2 tablas intermedia que se autogeneraron por ser N:M).
    - **Bug real corregido el mismo día (reportado: "cuando quiebro una relación... si hay una
      relación intermedia, esta relación intermedia no sigue la relación que se rompió con
      Ctrl+click"):** `AssociationClassOverlay` calculaba el punto medio de la línea N:M con
      `calcularParametrosAristaHaciaPunto` apuntando al CENTRO de la otra tabla — ignoraba por
      completo los puntos de control que el usuario le hubiera agregado a esa relación con
      `Ctrl`+arrastrar, así que el punteado hacia la tabla intermedia seguía saliendo de la línea
      recta original mientras la línea real ya estaba "quebrada" en otro lado. `AsociacionClase`
      (`lib/relacionesDerivadas.ts`, ver reorganización más abajo) ahora incluye
      `puntosControl: PuntoControl[]` (viene de
      `mn.puntosControl`, la relación N:M real detectada en `detectarAsociacionesClase`), y
      `AssociationClassOverlay` usa `construirRutaRelacion(nodoOrigen, nodoDestino,
      asociacion.puntosControl)` — la MISMA función que dibuja la línea real en `UmlRelationEdge`
      — para sacar el punto medio, en vez de recalcular un floating edge aparte que no sabía nada
      de los puntos. Verificado con una N:M de prueba en el proyecto 16: se le agregó un punto con
      `Ctrl`+arrastrar (moviéndola bien a la izquierda) y el punteado hacia la tabla intermedia
      arrancó exactamente del nuevo punto de quiebre, no de la posición vieja — capturado con
      screenshot real, sin errores de consola. Estado de prueba limpiado después.
    - **Reorganización según la regla "Anti-1k-Lines" (2026-09-20, pedido explícito: "ordenar todo,
      de acuerdo a la arquitectura y patrón de diseño ahora, lo más fiel posible a eso").** La
      iteración rápida del módulo de relaciones (control points agregados/sacados/restaurados,
      offsets paralelos, el fix de `AssociationClassOverlay`) había dejado varios archivos muy por
      encima del techo real que ya tiene el resto del proyecto (`project-members-dialog.tsx`, 164
      líneas, es el máximo actual fuera de `diagram/`) — `UmlRelationEdge.tsx` a 342 líneas y
      `useDiagramCanvas.ts` a 298. Se dividieron siguiendo exactamente los mecanismos que ya pide
      la sección 1.B/1.C de este documento (extraer a hooks, a `lib/` si es lógica pura sin JSX, a
      un componente propio si se reutiliza), sin agregar carpetas-por-componente donde no se
      justifica (ninguno de los archivos nuevos llega a los 3-4 archivos que ameritarían esa
      ceremonia):
      - `lib/diagramMappers.ts` (nuevo) — `entidadANodo()`/`relacionAArista()`, los mapeos puros de
        DTO del backend a `Node`/`Edge` de React Flow, sacados de `useDiagramCanvas.ts`.
      - `lib/relacionesDerivadas.ts` (nuevo) — `AsociacionClase` + `detectarAsociacionesClase()` +
        `calcularOffsetsParalelos()`: datos derivados del conjunto COMPLETO de relaciones (no de
        una relación puntual), sacados de `useDiagramCanvas.ts`. `useDiagramCanvas.ts` re-exporta
        el tipo `AsociacionClase` (`export type { AsociacionClase }`) para no romper el import que
        ya tenía `AssociationClassOverlay.tsx`.
      - `lib/controlPoints.ts` (nuevo) — `puntoSeparacionInicial()`/`encontrarSegmentoMasCercano()`,
        geometría pura de la interacción de puntos manuales, sacada de `UmlRelationEdge.tsx`.
      - `hooks/usePuntosControlArrastre.ts` (nuevo) — todo el estado + eventos de arrastre
        (`puntosLocal`, los refs de drag, los 3 handlers de pointer) que antes vivía inline en
        `UmlRelationEdge.tsx` — es lógica de interacción pura, sin nada de JSX, exactamente el caso
        que la sección 1.B.2 pide separar en un hook.
      - `components/edges/MultiplicidadBadge.tsx` (nuevo) — el "(1..*)" con su `DropdownMenu`,
        sacado de `UmlRelationEdge.tsx` (se usaba 2 veces ahí, cumple el criterio de reutilización
        de la sección 1.C).
      - `lib/relationCrossing.ts` (nuevo) — toda la geometría de `RelationCrossingOverlay.tsx`
        (`muestrearPath`/`interseccionDeSegmentos`/`tangenteYEstilo`/`calcularSaltos`), dejando el
        componente solo con el `useEffect` + el render del SVG.
      - **Resultado:** `UmlRelationEdge.tsx` 342→152 líneas, `useDiagramCanvas.ts` 298→178,
        `RelationCrossingOverlay.tsx` 185→68 — los tres dentro (o muy cerca) del techo real de 164
        líneas que ya tiene el resto del proyecto. **Deliberadamente NO tocados:**
        `AssociationClassOverlay.tsx` (138 líneas) y `attribute-form-dialog.tsx` (171) — ya están en
        el mismo orden de magnitud que el máximo existente en el resto de la app, forzar una
        división ahí sería más fragmentación que la que tiene cualquier componente comparable
        (`create-task-dialog.tsx`, 132 líneas, tampoco separa su lista de opciones a un `.data.ts`
        pese a que la sección 1.C lo sugeriría — se prioriza ser fiel a la convención REAL del
        proyecto, no a la letra de la regla más estricto que el resto de la base). `DiagramEditorPage.tsx`
        (105 líneas) tampoco — la "regla de páginas delgadas (<30 líneas)" es aspiracional, no
        seguida en ningún lado real del proyecto (`ProjectsDashboardPage.tsx` tiene 134).
      - **Verificado:** `tsc -b`, `npm run build` y `npm run lint` limpios (mismos warnings
        preexistentes, ninguno nuevo) y re-verificado en vivo vía Playwright el caso completo
        (N:M + Ctrl+arrastrar + `AssociationClassOverlay` seguiendo el punto) — mismo comportamiento
        exacto que antes de la reorganización, sin errores de consola. Estado de prueba limpiado.
    - **`RelationCrossingOverlay.tsx`** (nuevo) — el "levantamiento": cuando dos relaciones
      *distintas* se cruzan en un punto que no es ninguna tabla, la de id numéricamente mayor se
      corta un poco y salta por encima con un arco chico — convención de diagramas de circuito,
      para no confundir un cruce con un quiebre de una sola línea. **No calcula la geometría de las
      relaciones de nuevo** — muestrea el `<path>` real ya renderizado en el DOM
      (`path.getPointAtLength()` cada ~6px) y prueba intersección de segmento contra segmento
      entre cada par de relaciones; funciona igual sin importar cómo se haya calculado esa forma
      (floating edge de toda la tabla, anclaje a fila, o el sistema de puntos de control que existió
      un rato ese mismo día, ver nota de arriba), sin duplicar esa lógica acá. Recorta el 10% de
      cada punta de la muestra
      antes de comparar — ahí es donde la línea toca su propia tabla, no es un "cruce" real. Corre
      en un `useEffect` con `requestAnimationFrame` (necesita el DOM ya pintado) — un frame de
      retraso, imperceptible.
      - **Bug real corregido antes de terminar:** el efecto solo dependía de `edges` — arrastrar
        una TABLA cambia `nodes`, no `edges` (`edges` solo cambia de referencia en el próximo
        `refetch()`), así que el arco nunca se hubiera recalculado en vivo mientras se arrastraba
        una tabla, que es el caso más común. Se agregó `nodes` a las dependencias.
      - **Encontrado por `npm run build`, no por `tsc --noEmit` — ver nota de proceso más abajo:**
        un `cede.selected`/`cede.data` en vez de `cede.edge.selected`/`cede.edge.data` (`cede` era
        `{edge, puntos}`, no el edge en sí) — un error de tipos real que `tsc --noEmit` nunca marcó.
      - **Bug visual real corregido el mismo día (2do pedido, reportado como "aparece la línea
        cortada cuando hay un salto"):** la primera versión tapaba un tramo con
        `var(--background)` y dibujaba encima el arco de la línea que salta, pero las DOS líneas
        pasan exactamente por el mismo punto de cruce — ese tapado le comía un pedazo real a la
        línea que se suponía debía quedar intacta, y nunca se reconstruía: quedaba con un corte de
        verdad en el medio (justo el "bug visual" reportado, y para la línea equivocada). Reescrito:
        ahora se tapa con un **círculo** (cubre a las dos sin depender del ángulo de cruce, antes
        era un rectángulo alineado solo a la línea que salta) y se reconstruye una a una — primero
        un segmento recto de la línea "que pasa" (con su color/ancho reales) y encima el arco de la
        "que salta". De paso se cambió de dónde sale el color/ancho: antes se aproximaban con
        `colorLineaRelacion`/`anchoLineaRelacion` (`lib/relationStyle.ts`); ahora se leen con
        `getComputedStyle()` sobre el `<path>` real de cada línea (`tangenteYEstilo`) — un ancho
        aproximado de menos dejaba asomar un borde de la línea vieja, otra causa del mismo "corte".
    - **`UmlRelationEdge.estiloLinea`** dejó de devolver `undefined` en el caso default (antes
      dejaba que `<BaseEdge>`/CSS de React Flow decidieran el gris por default) — ahora siempre usa
      `colorLineaRelacion`/`anchoLineaRelacion` (`lib/relationStyle.ts`) explícito, mismo valor
      (`var(--muted-foreground)`/`1.5`) que ya usaba `AssociationClassOverlay` para su propio
      default. `lib/relationStyle.ts` ya no lo usa `RelationCrossingOverlay` (ver bug visual
      arriba — ahora lee el estilo real con `getComputedStyle`), queda como la única fuente de
      verdad del estilo default/seleccionado/resaltado de una relación, usada solo acá.
    - **⚠️ Nota de proceso, no de la feature:** `npx tsc --noEmit` desde la raíz de
      `case-frontend` **no compila nada real** — `tsconfig.json` tiene `"files": []` y solo
      `references` a `tsconfig.app.json`/`tsconfig.node.json` (proyecto compuesto). Sin `-b`
      (`tsc -b`), TypeScript valida que las referencias existan pero no chequea ni un archivo de
      `src/`, así que da "sin errores" incluso con errores reales — pasó en este mismo cambio (el
      bug de `cede.edge` de arriba, y un `connectionMode="loose"` de la nota anterior que
      TypeScript rechaza porque `ConnectionMode` es un enum, no un string — ninguno de los dos lo
      marcó `tsc --noEmit`, recién saltaron con `npm run build`, que sí corre `tsc -b`). **De acá
      en adelante, el chequeo de tipos real de este proyecto es `npx tsc -b` (o directamente
      `npm run build`), no `npx tsc --noEmit` a secas.**
- **`features/xmi/` — Fase 3 completa (2026-09-20, pedido explícito: "para el xmi ahora integralo
  ya toca"):** exportar descarga un `.xmi` real del proyecto (formato completo en
  `case-backend/AGENTS.md`, sección "Interoperabilidad XMI"); importar lee un `.xmi` y agrega sus
  tablas/atributos/relaciones al proyecto actual.
  - **`lib/api.ts` — dos agregados nuevos a `apiFetch`, primera vez que este proyecto necesita
    subir/bajar un archivo (todo lo demás hasta ahora era JSON puro):** `raw: true` devuelve el
    `Response` crudo sin `.json()` (`exportXmi` llama `.blob()` sobre eso) — y el `Content-Type:
    application/json` automático ahora se salta si el `body` es una `FormData` (`importXmi`), que
    arma su propio `Content-Type` con el boundary del multipart; fijarlo a mano lo rompía.
  - **`api/xmiApi.ts`:** `exportXmi()`/`importXmi()`. `importXmi` tipa su respuesta como `void` a
    propósito — el backend devuelve el lienzo completo actualizado, pero no hace falta acá: tras
    importar se navega a `/diagrama`, que hace su propio fetch fresco (evita acoplar esta feature
    al tipo `DiagramaResponse` de `features/diagram/`).
  - **`hooks/useXmiExchange.ts`:** `handleExportar` arma la descarga en el navegador a mano
    (`URL.createObjectURL` + un `<a download>` sintético con `.click()`, sin ningún paso
    intermedio); `handleImportar` navega a `/proyectos/:id/diagrama` al terminar. Errores de
    exportar e importar en dos estados separados (`errorExportar`/`errorImportar`) — un solo
    `error` compartido hubiera hecho que un error de exportación quedara pegado la próxima vez que
    se abre el diálogo de importar, y viceversa.
  - **`components/xmi-import-dialog.tsx`:** archivo suelto (no carpeta — no llega al criterio de
    la sección 1.C), mismo patrón visual que `ConfirmDialog`. `<Input type="file" accept=".xmi,...">`
    (ya traía estilos `file:` de shadcn, no hizo falta nada nuevo), botón de importar deshabilitado
    sin archivo elegido, error del import (si lo hay) se muestra adentro del diálogo, no afuera.
  - **`pages/ProjectXmiPage.tsx`:** ya no es el placeholder con botones `disabled` — página delgada
    que solo compone `useXmiExchange` + `XmiImportDialog`.
  - **Verificado end-to-end vía Playwright real (2026-09-20):** exportar desde el proyecto 16
    (descarga real del navegador, no simulada) → importar ese mismo archivo en un proyecto nuevo
    y vacío → mismas 5 tablas, mismas posiciones, redirección automática a `/diagrama` mostrando
    el resultado. También el caso de error: reimportar en un proyecto con nombres ya existentes
    muestra el `409` del backend (`"Ya existe una entidad llamada '...' en este proyecto"`)
    legible adentro del diálogo, sin romper nada — la importación es transaccional en el backend
    (ver `case-backend/AGENTS.md`), así que no queda ninguna tabla a medio crear.
  - **`project-nav-rail.data.ts`:** el label del ítem del riel pasó de "Exportar XMI" a "XMI" —
    ya no es solo exportar.
  - **Cambio de formato del `.xmi` (2026-09-20, mismo día, pedido explícito: "quiero que sea el
    mismo formato que el xmi de erp_bolivia... con relación intermedia") — 100% backend, sin
    tocar nada acá:** el frontend nunca interpreta el contenido del archivo (exportar solo baja un
    `Blob`, importar solo sube un `File`), así que el cambio de dialecto XMI (ver
    `case-backend/AGENTS.md`) no tocó ni una línea de `features/xmi/`.
- **Auditoría arquitectónica y optimización de rendimiento frontend (2026-09-20, pedido explícito:
  "optimizar codigo que puedas, en frontend, ver la arquitectura y patron de diseño"):**
  - **Code Splitting & Reducción de Bundle (`App.tsx`):** todas las páginas se migraron a `React.lazy()`
    con `<Suspense fallback={<PageLoader />}>`. El chunk principal de la aplicación bajó de **714 kB a
    316 kB** (101 kB gzipped), eliminando la advertencia de Vite sobre chunks > 500 kB. La librería pesada
    de lienzo `@xyflow/react` quedó aislada en el chunk bajo demanda `DiagramEditorPage` (213 kB / 68 kB
    gzipped), haciendo que login, registro y dashboard carguen instantáneamente.
  - **Extracción de componente DRY transversal (`UserAvatarMenu.tsx`):** se extrajo el dropdown de
    usuario con avatar, nombre y "Cerrar sesión" a `src/components/common/UserAvatarMenu.tsx`,
    eliminando la implementación duplicada que existía entre `ProjectsDashboardPage` y `ProjectNavRail`.
  - **Desmonolitización de `project-members-dialog`:** se redujo `project-members-dialog.tsx` de 165 a
    110 líneas dividiéndolo en `project-members-dialog.data.ts` (roles disponibles, Data-Driven UI) y
    `member-item.tsx` (fila de colaborador individual).
  - **Rendimiento de renderizado en React Flow:**
    - `React.memo` en nodos, aristas y overlays de alta frecuencia (`EntityNode`, `FilaAtributo`,
      `UmlRelationEdge`, `MultiplicidadBadge`, `PuntoControlHandle`, `AssociationClassLine`), cortando
      re-renders innecesarios durante el zoom, paneo o arrastre de elementos individuales en el lienzo.
    - `useMemo` para cálculo de PKs vs resto de atributos en `EntityNode.tsx`.
    - `useMemo` en `useDiagramCanvas.ts` para `asociaciones`, `idsTablaIntermedia` y `selectedEntidad`.
  - **Aceleración geométrica en `relationCrossing.ts` (AABB Spatial Pre-filtering):** se implementó
    descarte temprano por caja envolvente (`calcularBoundingBox` y `cajasSolapan`). El cálculo de cruces
    de líneas ahora salta las pruebas de intersección segmento a segmento ($O(N \cdot M)$) para cualquier
    par de aristas que no comparta un área delimitada, aligerando el cálculo en lienzos grandes.
  - **Memoización de filtrado de datos:** `useMemo` en búsqueda de proyectos (`ProjectsDashboardPage`),
    agrupación de tareas por estado en un único paso O(N) (`ProjectTasksPage`) y listas estáticas/entidades
    en `attribute-form-dialog.tsx`.
  - **Verificación:** `npm run build` (`tsc -b && vite build`) y `oxlint` limpios con 0 errores de tipos
    y sin warnings de bundle size.

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
│   │   │   ├── select.tsx             # ✅ instalado
│   │   │   ├── alert.tsx              # ✅ instalado
│   │   │   ├── empty.tsx              # ✅ instalado
│   │   │   ├── skeleton.tsx           # ✅ instalado
│   │   │   ├── checkbox.tsx           # ✅ instalado (2026-09-16, para atributos PK/FK/nullable)
│   │   │   ├── switch.tsx             # ✅ instalado (2026-09-16, sin uso todavía)
│   │   │   ├── sheet.tsx              # 🔜 pendiente
│   │   │   └── toast.tsx              # 🔜 pendiente
│   │   ├── feedback/                  # Componentes de estado global
│   │   │   ├── LoadingScreen.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── common/                    # Componentes reutilizables generales
│   │       ├── ConfirmDialog.tsx      # ✅ construido (2026-09-11) — genérico sobre `Dialog`,
│   │       │                          #   usado en eliminar tarea y quitar colaborador
│   │       ├── UserAvatarMenu.tsx     # ✅ (2026-09-20, optimización DRY) — menú desplegable con avatar,
│   │       │                          #   perfil y "Cerrar sesión" compartido entre ProjectsDashboard y nav-rail
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
│   │   ├── api.ts                     # ✅ `API_URL` + `apiFetch()` (2026-09-11) — interceptor de
│   │   │                              #   JWT real: agrega `Authorization: Bearer` automático y,
│   │   │                              #   ante un 401, limpia `localStorage` y manda a `/login`.
│   │   │                              #   `projectsApi`/`tasksApi`/`notesApi` ya migrados; `authApi`
│   │   │                              #   se queda con `fetch` directo (no hay token antes de login).
│   │   │                              #   `raw`/soporte `FormData` (2026-09-20, para `xmiApi`) —
│   │   │                              #   ver nota de la Fase 3 más arriba
│   │   ├── utils.ts                   # cn() y formateadores generales
│   │   ├── avatar.ts                  # ✅ existe (2026-09-08) — `colorAvatar()` (color determinístico
│   │   │                              #   por hash de id) + `iniciales()`. Extraído de
│   │   │                              #   `project-card.tsx` al reusarse en `project-nav-rail` y
│   │   │                              #   `task-card` — regla de extracción del proyecto (2+ lugares)
│   │   └── constants.ts               # Constantes globales del sistema
│   │
│   ├── routes/                        # ✅ Enrutamiento (2026-09-11)
│   │   ├── ProtectedRoute.tsx         # Sin token → `/login`. Envuelve `/proyectos` y `/proyectos/:id/*`
│   │   └── GuestRoute.tsx             # Con token → `/proyectos`. Envuelve `/login` y `/register`
│   │                                  #   (no proyectado originalmente, se agregó junto a ProtectedRoute
│   │                                  #   porque hacía falta el guard inverso). Sin `AppRoutes.tsx`
│   │                                  #   separado — las rutas se quedan en `App.tsx`, no hizo falta
│   │                                  #   extraerlas todavía.
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
│       │   │   └── projects.type.ts   # Proyecto, ProyectoRequest, ProyectoResponse,
│       │   │                          #   MiembroProyecto, RolProyecto (ADMIN, COLABORADOR,
│       │   │                          #   LECTOR — corregido 2026-09-06, ya no es solo ADMIN/MIEMBRO).
│       │   │                          #   `ProyectoResponse.rol` renombrado a `.miRol` (2026-09-11,
│       │   │                          #   bug real: no coincidía con lo que el backend devuelve)
│       │   ├── hooks/
│       │   │   ├── useProjects.ts
│       │   │   ├── useProjectMutations.ts
│       │   │   ├── useProjectMembers.ts   # colaboradores directos del proyecto (sin Grupo) — ahora
│       │   │   │                          #   expone `refetch()` (2026-09-11, lo necesita
│       │   │   │                          #   ProjectMembersDialog tras agregar/cambiar rol/quitar)
│       │   │   └── useMemberMutations.ts  # ✅ nuevo (2026-09-11) — addMember/changeRole/removeMember
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
│       │   │   └── project-members-dialog/ # ✅ construido (2026-09-11, optimizado 2026-09-20) — trigger "Colaboradores"
│       │   │       ├── project-members-dialog.tsx     # Diálogo principal de miembros (110 líneas)
│       │   │       ├── project-members-dialog.data.ts # ROLES_DISPONIBLES (Data-Driven UI)
│       │   │       ├── member-item.tsx                # Fila de colaborador individual
│       │   │       └── index.ts
│       │   │                          #   ADMIN agrega (usuario/email + rol), cambia rol y quita
│       │   │                          #   (con `ConfirmDialog`); demás roles ven la lista de solo lectura.
│       │   │                          #   Requirió `useMemberMutations.ts` y métodos en `projectsApi.ts`.
│       │   └── pages/
│       │       └── ProjectsDashboardPage.tsx
│       │
│       ├── tasks/                     # Módulo Tareas: Kanban de 3 columnas (✅ 2026-09-08/11)
│       │   ├── api/
│       │   │   └── tasksApi.ts        # getTasks(), createTask(), updateTaskStatus(), deleteTask()
│       │   ├── types/
│       │   │   └── tasks.type.ts      # TareaProyecto, TareaProyectoRequest, CambiarEstadoTareaRequest
│       │   ├── hooks/
│       │   │   ├── useTasks.ts        # Fetch de tareas del proyecto
│       │   │   └── useTaskMutations.ts # Creación, cambio de estado (flechas) y borrado
│       │   ├── components/
│       │   │   ├── create-task-dialog/
│       │   │   │   └── create-task-dialog.tsx
│       │   │   └── task-card/
│       │   │       ├── task-card.tsx
│       │   │       └── task-card.data.ts # ESTADOS_ORDEN y lógica de navegación de estado
│       │   └── pages/
│       │       └── ProjectTasksPage.tsx # Kanban (PENDIENTE / EN_PROGRESO / HECHO)
│       │
│       ├── notes/                     # Módulo Notas: Timeline de decisiones de diseño (✅ 2026-09-08)
│       │   ├── api/
│       │   │   └── notesApi.ts        # getNotes(), createNote()
│       │   ├── types/
│       │   │   └── notes.type.ts      # NotaProyecto, NotaProyectoRequest
│       │   ├── hooks/
│       │   │   ├── useNotes.ts        # Fetch de notas
│       │   │   └── useNoteMutations.ts # Creación (acción + motivo obligatorio)
│       │   ├── components/
│       │   │   ├── create-note-dialog/
│       │   │   │   └── create-note-dialog.tsx
│       │   │   └── note-item/
│       │   │       └── note-item.tsx
│       │   └── pages/
│       │       └── ProjectNotesPage.tsx # Feed inmutable tipo timeline
│       │

│       ├── diagram/                   # Módulo 3: Lienzo UML (@xyflow/react) — Fase 2 completa (2026-09-16)
│       │   ├── api/
│       │   │   └── diagramApi.ts      # ✅ getDiagram(), create/update/deleteEntity(),
│       │   │                          #   create/update/deleteAttribute(), create/deleteRelation()
│       │   ├── types/
│       │   │   └── diagram.types.ts   # ✅ EntidadDiagramaResponse/Request, AtributoEntidadResponse/
│       │   │                          #   Request, RelacionDiagramaResponse/Request (con
│       │   │                          #   multiplicidadOrigen/Destino: LadoMultiplicidad directo
│       │   │                          #   del backend, 2026-09-19 — ya no tipoRelacion/opcional*).
│       │   │                          #   `PuntoControl` (`{x,y}`) + `puntosControl: PuntoControl[]`
│       │   │                          #   en `RelacionDiagramaResponse` — puntos de control
│       │   │                          #   manuales, agregados/sacados/restaurados el 2026-09-20 (ver
│       │   │                          #   "Puntos de control arrastrables" arriba). DiagramaResponse
│       │   ├── lib/
│       │   │   ├── multiplicidad.ts   # ✅ (2026-09-19) solo 2 helpers puros — `etiquetaLado()`
│       │   │   │                      #   (texto a mostrar) y `esMuchosAMuchos(origen, destino)`
│       │   │   │                      #   (detecta el patrón de tabla intermedia). Ya no traduce
│       │   │   │                      #   nada: el backend guarda cada lado directo, no hace
│       │   │   │                      #   falta invertir origen/destino en ningún lado
│       │   │   ├── floatingEdge.ts    # ✅ (2026-09-20) `calcularParametrosAristaHaciaPunto()` —
│       │   │   │                      #   punto donde el segmento entre el centro de una tabla y un
│       │   │   │                      #   punto externo cruza su borde ("floating edge" de React
│       │   │   │                      #   Flow). Toma un punto externo arbitrario (no solo el
│       │   │   │                      #   centro de la otra tabla), por eso sirvió sin cambios de
│       │   │   │                      #   base a los puntos de control manuales (ver
│       │   │   │                      #   `relationPath.ts`). `centroDe()`/`offsetDesdePosicion()`
│       │   │   │                      #   de apoyo
│       │   │   ├── relationPath.ts    # ✅ (2026-09-20, reescrito de vuelta) `construirRutaRelacion(
│       │   │   │                      #   nodoOrigen, nodoDestino, puntosControl)` — polilínea recta:
│       │   │   │                      #   floating edge hacia el primer punto de control (o el
│       │   │   │                      #   centro de la otra tabla si no hay ninguno), una línea por
│       │   │   │                      #   cada punto intermedio, floating edge de salida en el otro
│       │   │   │                      #   extremo. Usado por `UmlRelationEdge` (dibuja la línea, con
│       │   │   │                      #   los puntos siendo arrastrables) — pasó por una versión
│       │   │   │                      #   intermedia (2026-09-20) que anclaba a la fila del
│       │   │   │                      #   atributo FK/PK estilo dbdiagram.io, revertida el mismo día
│       │   │   │                      #   a pedido explícito ("volver a como estabas antes"), ver
│       │   │   │                      #   "Puntos de control arrastrables" arriba
│       │   │   ├── controlPoints.ts   # ✅ (2026-09-20, nuevo — reorganización "Anti-1k-Lines", ver
│       │   │   │                      #   nota arriba) `puntoSeparacionInicial()` (offset paralelo
│       │   │   │                      #   inicial) + `encontrarSegmentoMasCercano()` (a qué índice
│       │   │   │                      #   insertar un punto nuevo con Ctrl+arrastrar) — geometría
│       │   │   │                      #   pura, sacada de `UmlRelationEdge.tsx`. Usada por
│       │   │   │                      #   `hooks/usePuntosControlArrastre.ts`
│       │   │   ├── relacionesDerivadas.ts # ✅ (2026-09-20, nuevo — misma reorganización) tipo
│       │   │   │                      #   `AsociacionClase` + `detectarAsociacionesClase()`
│       │   │   │                      #   (patrón "tabla intermedia de N:M") +
│       │   │   │                      #   `calcularOffsetsParalelos()` (separa relaciones
│       │   │   │                      #   duplicadas entre el mismo par de tablas) — datos
│       │   │   │                      #   derivados del conjunto COMPLETO de relaciones, sacados
│       │   │   │                      #   de `useDiagramCanvas.ts`
│       │   │   ├── diagramMappers.ts  # ✅ (2026-09-20, nuevo — misma reorganización)
│       │   │   │                      #   `entidadANodo()`/`relacionAArista()` — mapeo puro de
│       │   │   │                      #   DTO del backend a `Node`/`Edge` de React Flow, sacado
│       │   │   │                      #   de `useDiagramCanvas.ts`
│       │   │   ├── relationCrossing.ts # ✅ (2026-09-20, nuevo — misma reorganización)
│       │   │   │                      #   `muestrearPath()`/`interseccionDeSegmentos()`/
│       │   │   │                      #   `tangenteYEstilo()`/`calcularSaltos()` — toda la
│       │   │   │                      #   geometría de "dos relaciones se cruzan", sacada de
│       │   │   │                      #   `RelationCrossingOverlay.tsx`
│       │   │   └── relationStyle.ts   # ✅ (2026-09-20, nuevo) `colorLineaRelacion()`/
│       │   │                          #   `anchoLineaRelacion()` — mismo criterio de color/grosor
│       │   │                          #   que `UmlRelationEdge` usa para su `<BaseEdge>`, extraído
│       │   │                          #   para que `RelationCrossingOverlay` pinte el "salto" con
│       │   │                          #   un color parecido al real
│       │   ├── hooks/
│       │   │   ├── useDiagram.ts             # ✅ fetch + refetch del lienzo completo — `loading`
│       │   │   │                             #   solo en la carga inicial, no en cada `refetch()`
│       │   │   │                             #   post-mutación (2026-09-20, bug real corregido,
│       │   │   │                             #   ver nota de "parpadeo" más arriba)
│       │   │   ├── useEntityMutations.ts     # ✅ create/update(posición o nombre)/remove
│       │   │   ├── useAttributeMutations.ts  # ✅ (2026-09-16) create/update/remove, scoped a
│       │   │   │                             #   (proyectoId, entidadId) — mismo patrón `run()`
│       │   │   ├── useRelationMutations.ts   # ✅ (2026-09-16) create/update/remove de relaciones
│       │   │   ├── useDiagramCanvas.ts    # ✅ orquesta nodos+aristas de React Flow, selección de
│       │   │   │                          #   entidad (panel), edición de multiplicidad por lado
│       │   │   │                          #   (`handleEditLado`, sin diálogo, 2026-09-19) + borrado
│       │   │   │                          #   de relación vía `handleEdgesChange` (Supr/Backspace).
│       │   │   │                          #   298→178 líneas (2026-09-20, reorganización "Anti-1k-
│       │   │   │                          #   Lines", ver nota arriba) — los mapeos puros
│       │   │   │                          #   (`entidadANodo`/`relacionAArista`) y los datos
│       │   │   │                          #   derivados de TODAS las relaciones
│       │   │   │                          #   (`detectarAsociacionesClase`/
│       │   │   │                          #   `calcularOffsetsParalelos`) se movieron a `lib/`
│       │   │   ├── usePuntosControlArrastre.ts # ✅ (2026-09-20, nuevo — misma reorganización)
│       │   │   │                          #   estado + eventos de arrastre de los puntos de
│       │   │   │                          #   control manuales (`puntosLocal`, los 3 handlers de
│       │   │   │                          #   pointer) — sacado de `UmlRelationEdge.tsx`, usado
│       │   │   │                          #   solo ahí (hook local de la sección 1.E)
│       │   │   ├── useDiagramHistory.ts   # 🔜 Undo / Redo, pendiente
│       │   │   └── useCanvasShortcuts.ts  # 🔜 Atajos de teclado (Ctrl+Z, Supr, etc.), pendiente
│       │   ├── components/
│       │   │   ├── nodes/
│       │   │   │   └── EntityNode.tsx # ✅ archivo suelto (no cumple ningún criterio de la sección
│       │   │   │                      #   1.C para carpeta propia). Header (nombre + badge "TABLE"
│       │   │   │                      #   + badge "auto" si es tabla intermedia + borrar vía
│       │   │   │                      #   `ConfirmDialog`, clase `nodrag`), cuerpo con atributos de
│       │   │   │                      #   solo lectura (PK agrupadas arriba con `Separator`, ícono
│       │   │   │                      #   `KeyRound`/`Link2` en vez de badges de texto, indicador
│       │   │   │                      #   de nullable, zebra striping — 2026-09-19), y 4
│       │   │   │                      #   `Handle` (arriba/derecha/abajo/izquierda, los 4
│       │   │   │                      #   `type="source"`, solo visibles al hover, ver `index.css`)
│       │   │   │                      #   para arrastrar relaciones desde cualquier lado —
│       │   │   │                      #   "floating edges" (2026-09-20): `UmlRelationEdge` recalcula
│       │   │   │                      #   solo cuál usar visualmente según dónde está la otra tabla
│       │   │   │                      #   (ver `lib/floatingEdge.ts`/`lib/relationPath.ts`), no
│       │   │   │                      #   importa cuál se usó al conectar. Rename y CRUD de
│       │   │   │                      #   atributos viven en el panel lateral (no en el nodo, para
│       │   │   │                      #   no recargar el canvas — ver `panel/` abajo)
│       │   │   ├── panel/
│       │   │   │   └── entity-properties-panel/ # ✅ (2026-09-16, Fase 2.2/2.4) carpeta — supera el
│       │   │   │       │                        #   criterio de 1.C (>80 líneas + form real)
│       │   │   │       ├── entity-properties-panel.tsx # Panel flotante al seleccionar una tabla:
│       │   │   │       │                               #   rename inline + lista de atributos
│       │   │   │       │                               #   (badges PK/FK, editar/borrar por fila,
│       │   │   │       │                               #   inline como en `project-members-dialog`)
│       │   │   │       ├── attribute-form-dialog.tsx   # Un solo diálogo crear+editar atributo
│       │   │   │       │                               #   (modo lo decide si recibe `atributo`);
│       │   │   │       │                               #   Select de tipo SQL, Checkbox PK/FK/
│       │   │   │       │                               #   nullable, Select de referencia FK
│       │   │   │       └── index.ts
│       │   │   ├── edges/
│       │   │   │   ├── PuntoControlHandle.tsx # ✅ (2026-09-20, agregado→sacado→restaurado el mismo
│       │   │   │   │                          #   día, ver "Puntos de control arrastrables" arriba)
│       │   │   │   │                          #   el círculo arrastrable de un punto de control —
│       │   │   │   │                          #   presentacional puro (`EdgeLabelRenderer`, área de
│       │   │   │   │                          #   agarre más grande que el punto visible), toda la
│       │   │   │   │                          #   lógica de arrastre/borrado vive en `UmlRelationEdge`
│       │   │   │   ├── MultiplicidadBadge.tsx # ✅ (2026-09-20, nuevo — reorganización "Anti-1k-
│       │   │   │   │                          #   Lines", ver nota arriba) el "(1..*)" con su
│       │   │   │   │                          #   `DropdownMenu` de 4 opciones — sacado de
│       │   │   │   │                          #   `UmlRelationEdge.tsx` (se usa 2 veces ahí, origen
│       │   │   │   │                          #   y destino)
│       │   │   │   ├── UmlRelationEdge.tsx    # ✅ (2026-09-20) `<BaseEdge>` — línea simple, sin
│       │   │   │   │                          #   flecha ni marcador (se probó notación "pata de
│       │   │   │   │                          #   gallo" con `<marker>` SVG el 19, se sacó el 20 a
│       │   │   │   │                          #   pedido explícito) — + 2 `MultiplicidadBadge` con
│       │   │   │   │                          #   la multiplicidad entre paréntesis ("(1)"/
│       │   │   │   │                          #   "(1..*)"/etc.) vía `EdgeLabelRenderer` — sin pill
│       │   │   │   │                          #   del medio, sin botón de borrar propio (ver
│       │   │   │   │                          #   `useDiagramCanvas`). Se resalta (`data.resaltada`)
│       │   │   │   │                          #   si la tabla seleccionada es uno de sus 2 extremos.
│       │   │   │   │                          #   Requiere `pointer-events-auto` en el label — el
│       │   │   │   │                          #   contenedor de RF trae `pointer-events: none` por
│       │   │   │   │                          #   default. Arma la línea con `lib/relationPath.ts`
│       │   │   │   │                          #   (`construirRutaRelacion`, con los puntos de
│       │   │   │   │                          #   control manuales — ver "Puntos de control
│       │   │   │   │                          #   arrastrables" arriba), no con coordenadas de
│       │   │   │   │                          #   handle de `EdgeProps` (asumían un lado fijo).
│       │   │   │   │                          #   `Ctrl`+arrastrar sobre la línea agrega un punto;
│       │   │   │   │                          #   arrastrar un punto lo mueve; `Ctrl`+click (sin
│       │   │   │   │                          #   arrastre real) sobre un punto lo quita — toda esa
│       │   │   │   │                          #   interacción vive en
│       │   │   │   │                          #   `hooks/usePuntosControlArrastre.ts` (342→152
│       │   │   │   │                          #   líneas, 2026-09-20, reorganización "Anti-1k-Lines",
│       │   │   │   │                          #   ver nota arriba), acá solo se conecta a la línea
│       │   │   │   ├── AssociationClassOverlay.tsx # ✅ (2026-09-19/20) el punto de partida de la
│       │   │   │   │                               #   línea punteada usa `construirRutaRelacion`
│       │   │   │   │                               #   (`lib/relationPath.ts`) con
│       │   │   │   │                               #   `asociacion.puntosControl` (viene de
│       │   │   │   │                               #   `mn.puntosControl` en
│       │   │   │   │                               #   `lib/relacionesDerivadas.ts`) — la MISMA
│       │   │   │   │                               #   función que dibuja la línea real en
│       │   │   │   │                               #   `UmlRelationEdge`, sigue el punto de quiebre
│       │   │   │   │                               #   si el usuario la redirigió a mano (bug real
│       │   │   │   │                               #   corregido 2026-09-20, ver arriba). Entra por
│       │   │   │   │                               #   el borde más cercano de la tabla intermedia
│       │   │   │   │                               #   (`puntoDeEntrada`, no su centro). Caso aparte
│       │   │   │   │                               #   para N:M recursivas (2026-09-20, bug real
│       │   │   │   │                               #   corregido): ahí replica la fórmula del lazo
│       │   │   │   │                               #   de `UmlRelationEdge`. También se resalta si
│       │   │   │   │                               #   la tabla seleccionada es origen/destino/
│       │   │   │   │                               #   junction de la asociación
│       │   │   │   └── RelationCrossingOverlay.tsx # ✅ (2026-09-20) el "levantamiento" al cruzar
│       │   │   │                                   #   dos relaciones distintas — muestrea el
│       │   │   │   │                               #   `<path>` real ya renderizado en el DOM
│       │   │   │   │                               #   (`path.getPointAtLength()`), no recalcula la
│       │   │   │   │                               #   geometría de las relaciones. Tapa con un
│       │   │   │   │                               #   CÍRCULO (no un rectángulo, bug visual real
│       │   │   │   │                               #   corregido el mismo día, ver nota arriba) y
│       │   │   │   │                               #   reconstruye la línea que no salta encima,
│       │   │   │   │                               #   con su color/ancho reales (`getComputedStyle`,
│       │   │   │   │                               #   no una aproximación). Depende de `nodes` Y
│       │   │   │   │                               #   `edges` (bug real corregido antes: solo
│       │   │   │   │                               #   dependía de `edges`, arrastrar una tabla no
│       │   │   │   │                               #   lo hubiera disparado). 185→68 líneas
│       │   │   │   │                               #   (2026-09-20, reorganización "Anti-1k-Lines",
│       │   │   │   │                               #   ver nota arriba) — toda la geometría de
│       │   │   │   │                               #   muestreo/intersección se movió a
│       │   │   │   │                               #   `lib/relationCrossing.ts`, acá queda solo el
│       │   │   │   │                               #   `useEffect` + el render del SVG
│       │   │   ├── toolbar/
│       │   │   │   └── CanvasToolbar.tsx # ✅ botón "+ Entidad" (diálogo para nombrar la
│       │   │   │                         #   tabla) — único botón; el de "Auto-organizar" (dagre) se probó y
│       │   │   │                         #   sacó el mismo día (2026-09-20, ver nota arriba, floating edges lo
│       │   │   │                         #   volvió innecesario). Zoom/fit ya los resuelve `<Controls/>` de
│       │   │   │                         #   React Flow directo
│       │   │   └── ai-command-bar/    # 🔜 pendiente (Fase 5) — confirmado por el prototipo: input
│       │   │                          #   flotante abajo-centro, "Pide un cambio al modelo... ⌘K" +
│       │   │                          #   botón de voz + enviar — UI conjunta de CU13 (generar
│       │   │                          #   backend) y CU14 (voz)
│       │   └── pages/
│       │       └── DiagramEditorPage.tsx # ✅ página delgada: compone `<CanvasToolbar/>` +
│       │                                 #   `<EntityPropertiesPanel/>` (si hay selección) + `<ReactFlow/>`
│       │                                 #   (`<Background/>`, `<Controls/>`, `<MiniMap/>` — 2026-09-19,
│       │                                 #   `nodeTypes`/`edgeTypes`, `deleteKeyCode` propio) +
│       │                                 #   `<AssociationClassOverlay/>` + `<RelationCrossingOverlay/>`
│       │                                 #   (2026-09-20). Ya no compone `<RelationMarkers/>` (borrado,
│       │                                 #   ver nota "pata de gallo" arriba). `connectionMode=
│       │                                 #   {ConnectionMode.Loose}` en `<ReactFlow>` (2026-09-20, ver
│       │                                 #   nota "floating edges" arriba — bug real: el default
│       │                                 #   "strict" rechazaba conectar los 4 handles nuevos, todos
│       │                                 #   `type="source"`; el valor era el string `"loose"` hasta
│       │                                 #   que `npm run build` — no `tsc --noEmit`, ver nota de
│       │                                 #   proceso arriba — marcó que `ConnectionMode` es un enum).
│       │                                 #   Sin diálogo de relación (2026-09-19, ver nota arriba).
│       │                                 #   Fix de tema: React Flow trae `Controls`/`MiniMap`/
│       │                                 #   atribución con fondo blanco por default, sobreescrito
│       │                                 #   en `index.css`
│       │
│       ├── xmi/                       # Módulo 4: Interoperabilidad Enterprise Architect — ✅
│       │   │                          #   Fase 3 completa (2026-09-20, ver nota arriba)
│       │   ├── api/
│       │   │   └── xmiApi.ts          # ✅ exportXmi(proyectoId) -> Blob, importXmi(proyectoId,
│       │   │                          #   archivo: File) -> void
│       │   ├── hooks/
│       │   │   └── useXmiExchange.ts  # ✅ handleExportar (descarga en el navegador),
│       │   │                          #   handleImportar (navega a /diagrama al terminar),
│       │   │                          #   errorExportar/errorImportar separados
│       │   ├── components/
│       │   │   └── xmi-import-dialog.tsx  # ✅ archivo suelto (no carpeta), diálogo con
│       │   │                              #   <Input type="file">, mismo patrón que ConfirmDialog
│       │   └── pages/
│       │       └── ProjectXmiPage.tsx # ✅ página delgada — ya no el placeholder original
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
