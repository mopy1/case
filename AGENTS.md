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
├── .env.example              # POSTGRES_PASSWORD, CORS_ALLOWED_ORIGINS, DEEPSEEK_API_KEY, GEMINI_API_KEY (copiar a .env, nunca commitear;
│                             #   las claves de IA solo las lee el backend)
├── case-backend/             # API REST — Java 21 + Spring Boot 4.1 (Spring 7, Hibernate 7) + PostgreSQL 16
└── case-frontend/            # SPA — React 19 + TypeScript 6 + Vite 8 + Tailwind v4 + shadcn (Base UI) + @xyflow/react
```

El cliente móvil Flutter de pruebas (`~/projects/ialocal_sw`) quedó **descartado**: no es parte del sistema.

## 2. Arquitectura

- **Backend:** monolito modular (`core/` transversal, incl. `core/ia` = gateway de IA, + `modules/{seguridad,proyecto,diagrama,xmi,chat,copilot}`,
  cada uno con controller/dto/exception/model/repository/service). Autenticación JWT stateless;
  autorización por rol de proyecto (`ADMIN`, `COLABORADOR`, `LECTOR`) en `ProyectoAccesoService`.
  Esquema gestionado por Hibernate `ddl-auto=update` (10 tablas, sin migraciones; el índice GIN full-text `idx_chat_mensajes_fts`
  lo crea `ChatBusquedaIndiceInitializer` al arrancar). 43 endpoints bajo `/api` + WebSocket STOMP en `/ws`.
- **Frontend:** feature-based (`src/features/{auth,projects,diagram,tasks,notes,xmi,generator,copilot,chat,collaboration,voice}`).
  Las features se comunican por eventos `project:*` de `window`. Cliente HTTP único en `lib/api.ts`.
- **Lógica que corre solo en el navegador:** generador Spring Boot (JSZip) y voz (Web Speech API). **Ninguna llamada de IA sale
  del navegador** (F5): Senior Dev, Copilot y Guía usan `core/ia` en el backend (`DeepSeekClient`, `GeminiVisionClient` con la clave
  en el header `x-goog-api-key`). El Copilot llama a `POST /api/proyectos/{id}/copilot/consultas` (modos `ASISTENTE` | `GUIA`, cuota
  20/min por usuario, sin clave → respuesta del manual `resources/guia/manual.json`). El DDL PostgreSQL también lo genera el backend
  (`GET /api/proyectos/{id}/ddl`, determinístico, cualquier miembro).
- **Chat de equipo y Senior Dev IA (Parcial 2 · F1 y F2):** mensajes por REST (`/api/proyectos/{id}/chat/mensajes`,
  tabla `chat_mensajes`) y difusión en vivo por **WebSocket STOMP** (`/ws`, JWT en el CONNECT, membresía en el
  SUBSCRIBE, tópicos `/topic/proyectos/{id}/chat`, `.../chat/presencia` y `.../chat/ia`). Pestaña "Equipo" del panel Copilot.
  Solo la mención `@SeniorDev` (sin distinguir mayúsculas; regex de `ChatMencionIaUtils`, no reconoce `@dev` ni `@senior`)
  dispara, **después del commit** (`ChatMensajeBroadcastListener`, `AFTER_COMMIT`), la consulta `@Async` a DeepSeek en
  `SeniorDevService` (cola secuencial por proyecto). Emite `PENSANDO` por WS (uno por paso: "Revisando el diagrama…") y responde
  en el hilo (`respuestaAId`) como `tipo: IA` con `herramientasUsadas`.
  **F3 contexto largo:** prompt = reglas fijas + memoria acumulada (`chat_memoria`, resumen que actualiza `SeniorDevResumidor`
  cada ~20 mensajes fuera de la ventana) + estado compacto del proyecto + últimos 30 mensajes con `#id` + consulta con autor y rol.
  Tool calling de **solo lectura** (`obtenerDiagrama`, `listarTareas`, `listarNotas`, `buscarEnHistorial` full-text `spanish`) con
  `proyectoId`/`usuarioId` fijados por el servidor, máx. 3 rondas × 4 llamadas y 90 s (`SeniorDevLimites`).
  **F4 acciones:** acciones rápidas en el composer, "Guardar como ADR" (ADMIN/COLABORADOR), visor/descarga de DDL (`GENERAR_DDL`),
  diálogo "Memoria" (`GET .../chat/memoria`) y propuestas aplicables sincronizadas. Nginx enruta `/ws` con `Upgrade`.
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

## 4. Estado de módulos (verificado contra el código, 2026-10-25)

| Módulo | Qué hace hoy |
| :--- | :--- |
| Seguridad | Registro, login por username o email, JWT 24 h, roles por proyecto |
| Proyectos | CRUD de proyectos, miembros y roles (protege al último ADMIN), Kanban `PENDIENTE/EN_PROGRESO/HECHO`, notas de diseño |
| Diagramador | Tablas, atributos (PK/FK/tipo/nullable), relaciones con multiplicidad, herencia/composición/agregación, tabla intermedia N:M automática, puntos de quiebre |
| XMI | Exporta XMI 1.1 (EA); importa dialecto EA (1.1/2.1) y el propio, modo FUSIONAR o REEMPLAZAR (solo ADMIN) |
| Generador | ZIP de proyecto Spring Boot (entidades JPA, DTO, repository, service, controller) generado en el cliente; visor "Ver DDL PostgreSQL" (backend) con copiar/descargar `esquema-{id}.sql` |
| Copilot IA | Chat **individual por usuario** con dos modos: **Asistente** (DeepSeek para texto, Gemini para fotos; propone/aplica acciones sobre el lienzo) y **Guía** de inducción (enseña con el manual vía tool `buscarManual`, nunca modifica el proyecto). Todo pasa por el backend (`/copilot/consultas`); sin IA responde el manual. Comparte con Equipo el sistema de chat (`src/components/chat`) |
| Colaboración | Presencia, cursores remotos, refresco por polling |
| Chat de equipo y Senior Dev IA | Sala en tiempo real (STOMP), historial paginado, presencia, menciones con teclado, filtro por mención/miembro, voz y pantalla completa. Senior Dev (@SeniorDev) con contexto largo F3 (memoria acumulada, estado del proyecto, historial con `#id`, herramientas de solo lectura y búsqueda full-text) y acciones F4 (acciones rápidas, Guardar ADR, DDL, Memoria, propuestas aplicables sincronizadas con RBAC) |
| Voz | Dictado y push-to-talk (`Espacio`/`V`) que alimentan el Copilot |

## 5. Riesgos conocidos (auditoría 2026-10-24, pendientes de decisión)

1. ~~Claves de IA públicas~~ **(repo resuelto 2026-10-25, F5):** las llamadas IA del Copilot se movieron al backend
   (`core/ia` + `modules/copilot`); las claves viven solo en el `.env` de la raíz y llegan a `case_backend` como
   `${DEEPSEEK_API_KEY:-}` / `${GEMINI_API_KEY:-}`. **Falta al desplegar:** rotar ambas claves (las viejas estuvieron en el
   bundle público), cargarlas en el `.env` del EC2, recompilar `dist/` (sin claves) y el jar, y `up --build` (también
   reconstruye Nginx con `client_max_body_size 3m` y `proxy_read_timeout 120s` en `/api/`; sin eso, fotos > 1 MB dan 413).
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
`U/2-2026/SW/Parcial2/Plan.md`; especificaciones en `F1_Spec_Chat.md`, `F2_Spec_SeniorDev.md` y las de F3/F4.
- **F1 (chat grupal STOMP sin IA):** completada.
- **F2 (Senior Dev IA en el chat grupal con DeepSeek desde el backend):** completada.
- **F2+ (Mejoras y Propuestas Colaborativas Sincronizadas):** menciones dinámicas `@usuario` / `@SeniorDev` con corrección de navegación por flechas, barra de filtrado por menciones y miembro, resaltado de mención propia con badge `@ Te mencionaron`, normalización de espaciado Markdown y unificación de componentes con Copilot, calibración de contraste en modo oscuro (OKLCH), transcripción por voz, modo pantalla completa, y **propuestas colaborativas con sincronización y persistencia en tiempo real** (Senior Dev emite comandos estructurados limpios que el frontend procesa en tarjetas interactivas ejecutables con control RBAC; al aplicar, se persiste en BD, se difunde por WebSocket a toda la sala y se refleja "✓ Cambios aplicados en el proyecto por @username").
- **F3 (contexto largo):** completada — la IA sabe a quién responde (abre con `@autor`, hilo `respuestaAId`), recuerda con
  memoria acumulada + `buscarEnHistorial`, consulta datos exactos con herramientas y muestra "Consultó: …"; nunca debe afirmar
  consultas que no hizo. Spec: `F3_F4_Spec_Contexto_Acciones.md`.
- **F4 (acciones del chat):** completada — acciones rápidas, Guardar ADR, visor DDL (lo ve cualquier miembro; aplicar cambios
  requiere ADMIN/COLABORADOR), diálogo Memoria.
- **Rediseño de chats (F3/F4):** Equipo y Copilot comparten `ChatMessage`/`ChatComposer`/`ChatActionCard`; panel redimensionable
  (hasta 70 % del viewport, lienzo ≥ 360 px), columna centrada ≤ 768 px, scrollbars con tokens (sin blancos en oscuro). Spec:
  `F3_F4_Spec_Rediseno_Chats.md`.
- **F5 (Guía de inducción + Copilot personal al backend):** backend completado (2026-10-25) — endpoint
  `POST /api/proyectos/{id}/copilot/consultas` (Asistente/Guía, 400/403/429/503, respaldo MANUAL), manual de 17 temas,
  Guía con tool calling `buscarManual` e ids `GUIA_PASO`, aviso `SISTEMA` en la sala al agregar un miembro (AFTER_COMMIT).
  Spec: `F5_Spec_Guia_Induccion.md`. Frontend (misiones, tarjeta "Primeros pasos", modo Guía, coach marks) en su `AGENTS.md`.
  QA F5 (2026-10-25): aprobado en contenedores (claves solo en `case_backend`, bundle sin claves, foto de ~1,2 MB por Nginx,
  7 misiones, oferta única, aviso en vivo, móvil 390 px). Con la QA: `spring.jpa.open-in-view=false` (la conexión JDBC ya no
  queda tomada durante la llamada a la IA), Toaster con tema, `0..*`/`1..*` sin cursiva, comandos dentro de ``` sin residuos.

## 7. Reglas para agentes

1. Leer el `AGENTS.md` del paquete antes de tocarlo y actualizarlo en el mismo cambio.
2. Ningún archivo de código > 150 líneas (componentes React idealmente < 120); dividir por responsabilidad.
3. No cambiar entidades JPA ni el contrato REST sin pedido explícito; endpoint nuevo o modificado →
   tabla de `case-backend/AGENTS.md` + `U/2-2026/SW/Parcial1/App/Endpoints.md` del vault + sync de Qdrant.
4. El código debe poder defenderse línea por línea en el examen: simple, sin abstracciones de más.
5. Verificar: `./mvnw -q -DskipTests compile` (backend) y `npm run build` + `npm run lint` (frontend).
6. Contenedores `case_<parte>`; en compose local nunca `restart: always` / `unless-stopped`.
7. Commits locales descriptivos; **nunca `git push`** sin que el usuario lo pida.
