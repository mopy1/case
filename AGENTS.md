# CASE Tool — Parcial 1 (Ingeniería de Software)

Herramienta CASE colaborativa: modelado UML de bases de datos, generación asistida
de backend Spring Boot, interoperabilidad XMI con Enterprise Architect y control
por voz. Ver detalle completo en el Vault: `U/2-2026/SW/Parcial1/Enunciado.md` y
`U/2-2026/SW/Parcial1/Plan de Trabajo.md`. Seguimiento de avance y decisiones para
el parcial: `SW/Parcial1/backend/Backend.md` del vault.

```text
/home/lmc/projects/sw-case/
├── docker-compose.yml      # Postgres + backend + frontend, los 3 servicios (ver abajo)
├── .env.example            # Variables para docker-compose
├── case-backend/           # Spring Boot (Java 21) — API REST de proyectos, diagramas y auth
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

- ✅ Fase 1 (estructura base + modelo de datos) y login (JWT) — backend.
- ✅ Scaffold del frontend + shadcn/Base UI instalado — sin componentes de negocio (login/register en construcción, a mano).
- 🔜 Próximo paso acordado: módulo `grupo` (colaboración por equipos) en el backend.
- ⏳ Fases 2 (canvas UML), 3 (XMI), 4 (generador de backend), 5 (voz/foto), 6 (colaboración en tiempo real), 7 (app móvil Flutter) y 8 (documentación formal) — sin iniciar.
