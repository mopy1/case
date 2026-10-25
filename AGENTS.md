# CASE Tool — Guía global del monorepo

Herramienta CASE colaborativa (Ingeniería de Software, semestre 2-2026): modelado visual de diagramas de
clases/tablas, proyectos con miembros y roles, Kanban, notas de diseño, Copilot IA, colaboración en
vivo, interoperabilidad XMI con Enterprise Architect y generación de un backend Spring Boot en ZIP.

Producción: **https://casetool-sw.duckdns.org** (AWS EC2). Detalle técnico de cada paquete:
[`case-backend/AGENTS.md`](case-backend/AGENTS.md) y [`case-frontend/AGENTS.md`](case-frontend/AGENTS.md).
Esta guía solo cubre lo transversal; si algo cambia, se actualiza en el mismo commit.

## 1. Estructura

```text
sw-case/
├── AGENTS.md                 # esta guía
├── docker-compose.yml        # dev local: case_postgres (5434), case_backend (8081), case_frontend (5173→80)
├── docker-compose.prod.yml   # prod EC2: red interna case_network, solo case_frontend expone 80/443
├── deploy-aws.sh             # en el EC2: instala Docker, crea swap 2 GB, `docker compose -f docker-compose.prod.yml up -d --build`
├── .env.example              # POSTGRES_PASSWORD, CORS_ALLOWED_ORIGINS (copiar a .env, nunca commitear)
├── case-backend/             # API REST — Java 21 + Spring Boot 4.1 (Spring 7, Hibernate 7) + PostgreSQL 16
└── case-frontend/            # SPA — React 19 + TypeScript 6 + Vite 8 + Tailwind v4 + shadcn (Base UI) + @xyflow/react
```

El cliente móvil Flutter de pruebas (`~/projects/ialocal_sw`) quedó **descartado**: no es parte del sistema.

## 2. Arquitectura

- **Backend:** monolito modular (`core/` transversal + `modules/{seguridad,proyecto,diagrama,xmi,chat}`,
  cada uno con controller/dto/exception/model/repository/service). Autenticación JWT stateless;
  autorización por rol de proyecto (`ADMIN`, `COLABORADOR`, `LECTOR`) en `ProyectoAccesoService`.
  Esquema gestionado por Hibernate `ddl-auto=update` (9 tablas, sin migraciones). 39 endpoints bajo `/api` + WebSocket STOMP en `/ws`.
- **Frontend:** feature-based (`src/features/{auth,projects,diagram,tasks,notes,xmi,generator,copilot,chat,collaboration,voice}`).
  Las features se comunican por eventos `project:*` de `window`. Cliente HTTP único en `lib/api.ts`.
- **Lógica que corre solo en el navegador:** generador Spring Boot (JSZip), Copilot IA (llamadas
  directas a DeepSeek / Gemini) y voz (Web Speech API).
- **Chat de equipo y Senior Dev IA (Parcial 2 · F1 y F2):** mensajes por REST (`/api/proyectos/{id}/chat/mensajes`,
  tabla `chat_mensajes`) y difusión en vivo por **WebSocket STOMP** (`/ws`, JWT en el CONNECT, membresía en el
  SUBSCRIBE, tópicos `/topic/proyectos/{id}/chat`, `.../chat/presencia` y `.../chat/ia`). Pestaña "Equipo" del panel Copilot.
  Mención `@dev`, `@senior` o `@seniordev` dispara en background la consulta a DeepSeek (vía backend `SeniorDevService`),
  emitiendo estado `PENSANDO` por WS y respondiendo en el hilo como mensaje `tipo: IA` con contexto en 4 capas (sistema, proyecto/diagrama/tareas/ADRs, historial reciente y pregunta con autor). Nginx enruta `/ws` con `Upgrade`.
- **Colaboración del lienzo:** sin WebSockets. Presencia y cursores por HTTP (`/api/proyectos/{id}/colaboracion`,
  heartbeat ~800 ms, mapa en memoria del backend), refresco del diagrama por polling cada 7 s y
  `BroadcastChannel` entre pestañas del mismo navegador.

## 3. Entornos

| | Dev local | Producción (EC2 `t3.micro`, `sa-east-1`) |
| :--- | :--- | :--- |
| BD | `case_postgres` en host `5434`, base `case_db` | `case_postgres`, solo red interna |
| Backend | `case_backend` en `8081` (Dockerfile compila con Maven) | `Dockerfile.prod` copia `target/*.jar` **ya compilado** |
| Frontend | Vite `npm run dev` (5173) o contenedor Nginx (`nginx.dev.conf`) | `Dockerfile.prod` copia `dist/` **ya compilado**; `nginx.conf` con SSL Let's Encrypt (`/etc/letsencrypt` montado), 80→301→443, `/api/` → `backend-app:8081` |
| Restart | sin política (encendido manual, regla del entorno) | `restart: always` (debe seguir arriba hasta fin de semestre) |

Antes de desplegar: `./mvnw -DskipTests package` en `case-backend` y `npm run build` en
`case-frontend` (con `.env.production`), porque `deploy-aws.sh` **no** compila. Variables `VITE_*`
se hornean en el bundle.

## 4. Estado de módulos (verificado contra el código, 2026-10-24)

| Módulo | Qué hace hoy |
| :--- | :--- |
| Seguridad | Registro, login por username o email, JWT 24 h, roles por proyecto |
| Proyectos | CRUD de proyectos, miembros y roles (protege al último ADMIN), Kanban `PENDIENTE/EN_PROGRESO/HECHO`, notas de diseño |
| Diagramador | Tablas, atributos (PK/FK/tipo/nullable), relaciones con multiplicidad, herencia/composición/agregación, tabla intermedia N:M automática, puntos de quiebre |
| XMI | Exporta XMI 1.1 (EA); importa dialecto EA (1.1/2.1) y el propio, modo FUSIONAR o REEMPLAZAR (solo ADMIN) |
| Generador | ZIP de proyecto Spring Boot (entidades JPA, DTO, repository, service, controller) generado en el cliente |
| Copilot IA | Chat **individual por usuario**: DeepSeek para texto, Gemini para fotos de diagramas; propone/aplica acciones sobre el lienzo |
| Colaboración | Presencia, cursores remotos, refresco por polling |
| Chat de equipo y Senior Dev IA | Sala en tiempo real (STOMP), historial paginado, presencia y asistencia Senior Dev con DeepSeek en el hilo (@dev / @senior) |
| Voz | Dictado y push-to-talk (`Espacio`/`V`) que alimentan el Copilot |

## 5. Riesgos conocidos (auditoría 2026-10-24, pendientes de decisión)

1. **Claves de IA públicas:** `VITE_DEEPSEEK_API_KEY` / `VITE_GEMINI_API_KEY` quedan en `dist/assets/*.js`
   (también la imagen Docker dev: el `.dockerignore` deja entrar `.env` a propósito para tener IA real en
   local). Rotarlas y mover las llamadas IA al backend.
2. ~~JWT falsificable en prod~~ **(repo resuelto 2026-10-24):** `docker-compose.prod.yml` ahora exige
   `JWT_SECRET` (`${JWT_SECRET:?...}`, compose no arranca sin ella). Falta aplicarlo en el EC2: agregar
   `JWT_SECRET=$(openssl rand -base64 48)` al `.env` del servidor y recrear `case_backend` (cierra todas las sesiones una vez).
3. `docker-compose.prod.yml` tiene una contraseña de Postgres por defecto en texto plano y `CORS_ALLOWED_ORIGINS: "*"`.
4. Presencia (`ColaboracionController`) no verifica membresía del proyecto.
5. Import EA con herencia (`UML:Class xmi.idref` anidado) crea entidades sin nombre → 409.
6. Disco del EC2 estuvo al 98 % (2026-09-21); revisar antes de cada `up --build`.

## 6. Ciclo Parcial 2

Enunciado en el vault: `U/2-2026/SW/Parcial2/Enunciado.md`. Requisito central: una IA "Senior Dev"
en un **chat grupal por proyecto** (respuestas visibles para todo el equipo, sabe a quién responde y
mantiene el hilo) usando la API de DeepSeek, más un agente de inducción. Plan por fases en
`U/2-2026/SW/Parcial2/Plan.md`; especificaciones en `F1_Spec_Chat.md` y `F2_Spec_SeniorDev.md`.
- **F1 (chat grupal STOMP sin IA):** completada.
- **F2 (Senior Dev IA en el chat grupal con DeepSeek desde el backend):** completada.
- Siguiente: **F3 (Agente de Inducción para nuevos miembros del equipo).**

## 7. Reglas para agentes

1. Leer el `AGENTS.md` del paquete antes de tocarlo y actualizarlo en el mismo cambio.
2. Ningún archivo de código > 150 líneas (componentes React idealmente < 120); dividir por responsabilidad.
3. No cambiar entidades JPA ni el contrato REST sin pedido explícito; endpoint nuevo o modificado →
   tabla de `case-backend/AGENTS.md` + `U/2-2026/SW/Parcial1/App/Endpoints.md` del vault + sync de Qdrant.
4. El código debe poder defenderse línea por línea en el examen: simple, sin abstracciones de más.
5. Verificar: `./mvnw -q -DskipTests compile` (backend) y `npm run build` + `npm run lint` (frontend).
6. Contenedores `case_<parte>`; en compose local nunca `restart: always` / `unless-stopped`.
7. Commits locales descriptivos; **nunca `git push`** sin que el usuario lo pida.
