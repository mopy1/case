# CASE Backend — Arquitectura y Árbol Proyectado

Fuente de verdad técnica exclusiva de `case-backend`. El `AGENTS.md` de la raíz del repo
solo enlaza para acá; el resumen de avance/decisiones para seguimiento del parcial vive en
el vault (`SW/Parcial1/backend/Backend.md`).

## Stack

Spring Boot, Java 21, PostgreSQL, JPA/Hibernate, Lombok, Spring Security + JWT (jjwt 0.12.6).

## Convención de paquetes (2026-09-05, guiada por `erp-backend`)

Cada módulo de negocio se organiza **por capa técnica en subpaquetes**, no con archivos
sueltos en la raíz del módulo — mismo patrón que `erp-backend` (`modules/seguridad/{controller,
dto,exception,model,repository,service}`):

```text
modules/<nombre_modulo>/
├── controller/   # Endpoints HTTP
├── dto/          # Request/Response (records)
├── exception/    # Excepciones específicas del módulo (no genéricas)
├── model/        # Entidades JPA
├── repository/   # Interfaces JpaRepository
└── service/      # Lógica de negocio
```

`core/` sigue siendo infraestructura transversal sin lógica de negocio: `core/config`
(CORS), `core/exception` (excepciones **genéricas**: `ResourceNotFoundException`,
`GlobalExceptionHandler` — las específicas de un módulo, como credenciales inválidas, viven
en el `exception/` de ese módulo), `core/security` (JWT).

## Paquete base: `com.casetool.backend`

- `core/config`: `CorsConfig`.
- `core/exception`: `ResourceNotFoundException`, `GlobalExceptionHandler`.
- `core/security`: `JwtService`, `JwtAuthenticationFilter`, `SecurityConfig` — auth JWT
  stateless, `permitAll` solo en `/api/auth/login` y `/api/auth/register`, todo lo demás
  requiere `Authorization: Bearer <token>`.
- `modules/seguridad`: **único módulo de negocio por el momento.** Login/register con JWT,
  sin roles ni bloqueo por intentos (simplificado a propósito, ver Backend.md del vault).
  - `controller/AuthController.java`
  - `dto/LoginRequest.java`, `RegisterRequest.java`, `AuthResponse.java`, `UsuarioResponse.java`
  - `exception/CredencialesInvalidasException.java`, `RecursoDuplicadoException.java`
  - `model/Usuario.java`
  - `repository/UsuarioRepository.java`
  - `service/AuthService.java`, `UsuarioDetailsService.java`

## ⚠️ Reducción de alcance (2026-09-05)

Por pedido explícito del usuario, se **eliminaron** `modules/project` y `modules/diagram`
(CRUD de proyectos y modelo de diagrama UML — Fase 1 del Plan de Trabajo) para dejar el
backend con **solo login** mientras se termina de definir la arquitectura. Las tablas
`projects`, `diagram_entities`, `diagram_entity_attributes`, `diagram_relations` también se
borraron de la base (estaban vacías, sin dato real perdido). El código sigue existiendo en
el historial de git (`git log`) por si se necesita recuperarlo — no se perdió trabajo, se
sacó a propósito del alcance actual.

Cuando se retome `project`/`diagram`, deben seguir la convención de subpaquetes de arriba
(`controller/dto/exception/model/repository/service`), no el estilo flat que tenían antes.

## Dev local (sin Docker)

Cluster PostgreSQL nativo en el puerto `5433` (rol `lmc`, base `case_db`, password
`case_password123` — ver `application.properties`). Levantar con `./mvnw spring-boot:run`
(puerto `8081`).

## Docker

`Dockerfile` multi-stage (Maven build → `eclipse-temurin:21-jre`). Se levanta junto a Postgres y
al frontend vía `../docker-compose.yml` (raíz de `sw-case/`) — variables reales en `../.env`
(gitignoreado, ver `../.env.example`). Dentro del compose usa el Postgres del propio compose
(puerto `5434` en el host), no el cluster nativo. Verificado end-to-end tras la
reestructuración: `docker compose up -d` → login real vía `POST /api/auth/login` → JWT emitido.

**Usuario de prueba (bootstrap manual, no seed):** `demo` / `secreta123` — vive en el volumen
`case_pgdata`, se pierde si se resetea.

## Endpoints (todos los que existen hoy)

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (público solo login/register)

## Árbol real actual

```text
case-backend/src/main/java/com/casetool/backend/
├── CaseBackendApplication.java
├── core/
│   ├── config/CorsConfig.java
│   ├── exception/
│   │   ├── ResourceNotFoundException.java
│   │   └── GlobalExceptionHandler.java
│   └── security/
│       ├── JwtService.java
│       ├── JwtAuthenticationFilter.java
│       └── SecurityConfig.java
└── modules/
    └── seguridad/
        ├── controller/AuthController.java
        ├── dto/
        │   ├── LoginRequest.java
        │   ├── RegisterRequest.java
        │   ├── AuthResponse.java
        │   └── UsuarioResponse.java
        ├── exception/
        │   ├── CredencialesInvalidasException.java
        │   └── RecursoDuplicadoException.java
        ├── model/Usuario.java
        ├── repository/UsuarioRepository.java
        └── service/
            ├── AuthService.java
            └── UsuarioDetailsService.java
```

## Pendiente (fases futuras del Plan de Trabajo — sin iniciar, plan sin cambios)

- `project`/`diagram`: a recrear con la convención de subpaquetes de arriba. `Project` incluye
  desde el arranque una tabla puente `project_miembros` (`usuario_id`, `project_id`, `rol`) —
  colaboración **directa por proyecto**, sin capa de `Grupo`/equipo (decisión 2026-09-05,
  detalle y por qué en `SW/Parcial1/backend/Backend.md` del vault). Cada usuario ve/edita solo
  los proyectos donde está agregado explícitamente, no "todos los de su equipo".
- Fase 3: exportar/importar XMI hacia Enterprise Architect.
- Fase 4: generador de backend Spring Boot a partir del modelo.
- Fase 5.2: foto → modelo (endpoint de visión).
- Fase 6: colaboración en tiempo real (WebSocket/STOMP) — iría en `core/websocket` +
  `modules/collaboration`.
