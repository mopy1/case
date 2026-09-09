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
├── case-backend/           # Spring Boot (Java 21) — solo login/register por ahora (ver AGENTS.md)
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
- ✅ Frontend: login **y register** funcionales con componentes shadcn (sin editar) — redirige
  a `/` que muestra "Hola". Modo oscuro forzado por el momento.
- ✅ Frontend (2026-09-08): dashboard de proyectos completo + página de proyecto (`/proyectos/:id`)
  con riel de navegación (Volver/Diagrama 🔒/Tareas/Notas/XMI/Generador), Tareas y Notas
  **funcionales de verdad** contra el backend. XMI y Generador son placeholders "próximamente"
  (el backend no tiene esas fases construidas). Falta solo el editor de diagrama (React Flow).
  Detalle en `case-frontend/AGENTS.md`.
- 🔜 Decisión de diseño tomada (2026-09-05): la colaboración va **directo por proyecto**
  (tabla `miembros_proyecto`), **sin** capa de `Grupo`/equipo — se descartó esa idea
  explícitamente, ver `SW/Parcial1/backend/Backend.md` del vault para el porqué. Roles reales
  (2026-09-06): `ADMIN` / `COLABORADOR` / `LECTOR` (se amplió de la idea original de solo
  `ADMIN`/`MIEMBRO` para poder dar acceso de solo lectura).
- 🔜 También construidos como modelo/repositorio (2026-09-06, service pendiente salvo Proyecto):
  `NotaProyecto` (notas de diseño con el "por qué" de cada cambio, visible a colaboradores) y
  `TareaProyecto` (asignación + prioridades). Se descartó explícitamente una bitácora de
  seguridad para admin — no hace falta por ahora.
- 📐 Convención de idioma (2026-09-05): sustantivos de dominio en español en toda la base de
  datos (`Usuario`, `Proyecto`, `MiembroProyecto`, `NotaProyecto`, `TareaProyecto`), sufijos
  técnicos en inglés (`Request`/`Response`/`Service`/etc.) — detalle en `case-backend/AGENTS.md`.
- 🔑 API keys de IA (BYOK): nunca en la base de datos — se guardan en `localStorage` del
  navegador y se mandan por header en cada request. Detalle en `case-backend/AGENTS.md`.
- ⏳ Todo lo demás (diagramas, canvas UML, XMI, generador de backend, voz/foto,
  colaboración en tiempo real, app móvil Flutter, documentación formal) — sin empezar.
