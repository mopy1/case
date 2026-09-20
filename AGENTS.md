# CASE Tool — Parcial 1 (Ingeniería de Software)

Herramienta CASE colaborativa: modelado UML de bases de datos, generación asistida
de backend Spring Boot, interoperabilidad XMI con Enterprise Architect y control
por voz. Ver detalle completo en el Vault: `U/2-2026/SW/Parcial1/Enunciado.md` y
`U/2-2026/SW/Parcial1/Plan de Trabajo.md`. Seguimiento de avance y decisiones para
el parcial: `SW/Parcial1/backend/Backend.md` del vault. Documentación formal
(casos de uso, diagramas de clases/paquetes/despliegue/secuencia, Proceso
Unificado): `SW/Parcial1/documentacion/` del vault.

```text
/home/lmc/projects/sw-case/
├── docker-compose.yml      # Postgres + backend + frontend, los 3 servicios (ver abajo)
├── .env.example            # Variables para docker-compose
├── case-backend/           # Spring Boot (Java 21)  (ver AGENTS.md)
│                           # → ver case-backend/AGENTS.md (fuente de verdad del backend)
└── case-frontend/          # React + TS + Tailwind v4 + React Router + shadcn/Base UI
                            # → ver case-frontend/AGENTS.md (fuente de verdad del frontend)
```

Este archivo es solo el índice global. La arquitectura, stack, endpoints y árboles de
carpetas detallados de cada parte viven en su propio `AGENTS.md`:

- **Backend:** [`case-backend/AGENTS.md`](./case-backend/AGENTS.md)
- **Frontend:** [`case-frontend/AGENTS.md`](./case-frontend/AGENTS.md)

## Infraestructura compartida

- **Puertos:** `8081` backend, `5173` frontend, `5433` Postgres nativo (dev sin Docker), `5434`
  Postgres Docker.
- **Docker:** los 3 servicios (`postgres-db`, `backend-app`, `frontend-app`) dockerizados y
  verificados end-to-end (2026-09-05) — `docker compose up -d` desde la raíz. El backend corre
  contra Postgres del propio compose (no el cluster nativo). Frontend: build Vite servido por
  Nginx (`case-frontend/Dockerfile` + `nginx.conf`, SPA fallback a `index.html`).
- **Git:** repo con historial real desde 2026-09-05 (antes no tenía ningún commit).
- **CORS:** el backend permite `http://localhost:5173` (`cors.allowed-origins`) — funciona igual
  con el frontend dockerizado, porque el navegador sigue viendo ese origen (Docker solo mapea
  el puerto del host).

## Estado general (ver detalle de fases en cada AGENTS.md)

- ✅ Backend: login/register (JWT) + módulos `proyecto` y `diagrama` **completos** (2026-09-06)
  siguiendo la convención de subpaquetes de `erp-backend`. `proyecto`: CRUD de proyectos,
  colaboradores (roles `ADMIN`/`COLABORADOR`/`LECTOR`), notas de diseño y tareas. `diagrama`:
  lienzo del proyecto — entidades (tablas), atributos (columnas, con soporte real de FK entre
  entidades) y relaciones (`UNO_A_UNO`/`UNO_A_MUCHOS`/`MUCHOS_A_MUCHOS`). Ambos verificados
  end-to-end contra Postgres real (CRUD completo, cascadas de borrado reales, y varios casos
  límite de autorización/integridad). Detalle y hallazgos de la revisión en `case-backend/AGENTS.md`.
- ✅ Frontend: login **y register** funcionales con componentes shadcn (sin editar). Modo oscuro
  forzado por el momento.
- ✅ Frontend (2026-09-08): dashboard de proyectos completo + página de proyecto (`/proyectos/:id`)
  con riel de navegación (Volver/Diagrama 🔒/Tareas/Notas/XMI/Generador), Tareas y Notas
  **funcionales de verdad** contra el backend. XMI y Generador son placeholders "próximamente"
  (el backend no tiene esas fases construidas). Falta solo el editor de diagrama (React Flow).
  Detalle en `case-frontend/AGENTS.md`.
- ✅ Sesión y colaboradores (2026-09-11): rutas protegidas (`/login`/`/register` inaccesibles con
  sesión, el resto exige sesión), logout real (antes no existía en ninguna parte de la UI), y
  gestión completa de colaboradores por proyecto (agregar/cambiar rol/quitar) — el backend ya lo
  tenía, faltaba la UI. De paso: fix real en el backend (401 vs 403, ver `case-backend/AGENTS.md`)
  y varios bugs/detalles de UI menores (confirmación antes de borrar tarea/colaborador, `.trim()`
  en formularios, espaciado de diálogos y tarjetas de tareas). Detalle en `case-frontend/AGENTS.md`.
- ✅ Fase 2 completa — editor de diagrama (arrancada 2026-09-11, terminada 2026-09-16, mejoras de
  ruteo/UX 2026-09-20): `@xyflow/react` en `/proyectos/:id/diagrama` — crear/arrastrar/borrar
  tabla, panel lateral para renombrarla y gestionar sus atributos (crear/editar/borrar, con tipo
  SQL, PK/FK/nullable y referencia a otra tabla), relaciones reales entre tablas con multiplicidad
  por lado y enganche "floating edge" a cualquier borde, puntos de control arrastrables para
  redirigir una línea a mano, y "levantamiento" visual cuando dos relaciones se cruzan. Detalle en
  `case-frontend/AGENTS.md`.
- ✅ Fase 3 completa — interoperabilidad XMI con Enterprise Architect (2026-09-20):
  `GET/POST /api/proyectos/{id}/xmi/{exportar,importar}` (backend, módulo `xmi` nuevo) +
  `/proyectos/:id/xmi` (frontend, botones reales en vez del placeholder). El formato de
  exportación se cambió el mismo día a pedido explícito (*"para exportar sea el mismo formato que
  el xmi de erp_bolivia... quiero que se vea simple, y con relación intermedia"*): XMI 1.1 estilo
  Enterprise Architect (`UML:Class`/`UML:Attribute`/`UML:Association`, ids con punto), sin
  namespace propio — cada N:M con tabla intermedia se exporta como un solo `UML:AssociationClass`
  (clase + asociación en un elemento), igual que EA de verdad, no como los 3 renglones sueltos del
  modelo interno. La importación sigue leyendo **dos** dialectos (el nuevo y el XMI 2.1 propio
  anterior). **Verificado con un archivo real de otro proyecto del usuario** (`erp_bolivia.xmi`,
  27 tablas + 9 tablas intermedia + 34 relaciones, un ERP hecho en Enterprise Architect): importar
  ese archivo → exportar de vuelta → reimportar el export, mismo conteo exacto en las 3 vueltas
  (36 entidades, 61 relaciones), sin duplicar ninguna tabla intermedia. Detalle en ambos `AGENTS.md`.
- 🔜 Decisión de diseño tomada (2026-09-05): la colaboración va **directo por proyecto**
  (tabla `miembros_proyecto`), **sin** capa de `Grupo`/equipo — se descartó esa idea
  explícitamente, ver `SW/Parcial1/backend/Backend.md` del vault para el porqué. Roles reales
  (2026-09-06): `ADMIN` / `COLABORADOR` / `LECTOR` (se amplió de la idea original de solo
  `ADMIN`/`MIEMBRO` para poder dar acceso de solo lectura).
- ✅ Notas y Tareas de proyecto (2026-09-06): tanto backend (`NotaProyectoService`/`Controller`, `TareaProyectoService`/`Controller`, permisos por rol, cascadas `ON DELETE`) como frontend (feed tipo timeline inmutable y tablero Kanban con cambio de estado por flechas) están 100% funcionales y verificados. Se descartó explícitamente una bitácora de seguridad para admin — no hace falta por ahora.
- 📐 Convención de idioma (2026-09-05): sustantivos de dominio en español en toda la base de
  datos (`Usuario`, `Proyecto`, `MiembroProyecto`, `NotaProyecto`, `TareaProyecto`), sufijos
  técnicos en inglés (`Request`/`Response`/`Service`/etc.) — detalle en `case-backend/AGENTS.md`.
- 🔑 API keys de IA (BYOK): nunca en la base de datos — se guardan en `localStorage` del
  navegador y se mandan por header en cada request. Detalle en `case-backend/AGENTS.md`.
- ⏳ Próximas fases pendientes: generador de backend Spring Boot (Fase 4, máxima prioridad técnica),
  voz/foto (Fase 5), colaboración en tiempo real (Fase 6), app móvil Flutter (Fase 7), documentación
  formal (Fase 8).

