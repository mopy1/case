# 🛠️ CASE Tool — Guía Técnica Global del Repositorio

> **Herramienta CASE Colaborativa (Ingeniería de Software - Parcial 1)**  
> Sistema integral para el modelado UML de bases de datos relacionales, trabajo en equipo, interoperabilidad XMI con Enterprise Architect y generación automatizada de backends Spring Boot.

---

## 🗂️ 1. Estructura del Monorepo

```text
/home/lmc/projects/sw-case/
├── docker-compose.yml          # Orquestación de contenedores (Postgres 16, Spring Boot, React Nginx)
├── .env                        # Variables locales (POSTGRES_PASSWORD, etc.)
│
├── case-backend/               # ☕ Backend Spring Boot 4 (Java 21)
│   └── AGENTS.md               # 📖 Especificación técnica, endpoints y arquitectura del backend
│
├── case-frontend/              # ⚛️ Frontend React 19 + Vite + Tailwind v4 + shadcn
│   └── AGENTS.md               # 📖 Especificación técnica, componentes y patrones del frontend
│
└── AGENTS.md                   # 📌 Esta guía técnica global
```

### 📖 Guías Especializadas de Arquitectura
- **Backend (Spring Boot):** [`case-backend/AGENTS.md`](./case-backend/AGENTS.md)
- **Frontend (React 19):** [`case-frontend/AGENTS.md`](./case-frontend/AGENTS.md)
- **Documentación en Obsidian Vault:** `/mnt/c/Users/lmc/Documents/Obsidian/U/2-2026/SW/Parcial1/`

---

## 🐳 2. Infraestructura y Entorno de Ejecución

| Servicio | Contenedor | Puerto Host | Descripción |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | `case_postgres` | `5434` (interno 5432) | PostgreSQL 16 con volumen persistente `case_pgdata` |
| **Backend API** | `case_backend` | `8081` | Spring Boot 4.1.1 en Eclipse Temurin 21 JRE |
| **Frontend Web** | `case_frontend` | `5173` | Build optimizado de Vite servido en Nginx Alpine |

### Comandos de Ejecución

```bash
# Levantar todos los servicios en Docker
docker compose up -d

# Reconstruir frontend y backend tras cambios locales sin tocar la BD
docker compose up -d --build backend-app frontend-app

# Ejecutar frontend localmente para desarrollo con HMR
cd case-frontend && npm run dev

# Ejecutar pruebas unitarias del backend contra Docker Postgres
cd case-backend && ./mvnw test -Dspring.datasource.url=jdbc:postgresql://localhost:5434/case_db -Dspring.datasource.username=case_user -Dspring.datasource.password=case_dev_pw123
```

---

## 🚦 3. Matriz de Estado de Fases del Proyecto

| Fase | Alcance | Estado | Detalles Técnicos |
| :---: | :--- | :---: | :--- |
| **Fase 1** | Fundación & Colaboración | ✅ **Completo** | Auth JWT, CRUD Proyectos, Miembros (`ADMIN`/`COLABORADOR`/`LECTOR`), Tareas Kanban y Notas. |
| **Fase 2** | Diagramador UML Interactivo | ✅ **Completo** | Canvas `@xyflow/react`, floating edges ortogonales, multiplicidad por lado, N:M con tabla intermedia automática, puntos de control manuales y salto visual de aristas. |
| **Fase 3** | Interoperabilidad XMI | ✅ **Completo** | Exportación e importación compatible con Enterprise Architect (XMI 1.1 `AssociationClass` y dialecto 2.1). Validado con `erp_bolivia.xmi`. |
| **Fase 4** | Generador de Backend Spring Boot | ✅ **Completo** | Motor cliente en frontend (TypeScript + JSZip + FileSaver) que empaqueta en ZIP un proyecto Spring Boot 3.4 / Java 21 compilable (JPA @ManyToOne/@OneToMany, DTOs, Service, Controller, OpenAPI, pom.xml). |
| **Fase 5** | Modos Alternativos (Voz / Foto) | ⏳ Pendiente | Control por voz (5.1) y Visión computacional foto a UML (5.2). |
| **Fase 6** | Edición en Tiempo Real | ⏳ Pendiente | WebSockets / STOMP para cursores y sincronización multi-usuario. |
| **Fase 7** | Aplicación Móvil (Offline) | ⏳ Pendiente | App móvil en Flutter conectada al backend generado con IA local (Vosk + Qwen2.5). |
| **Fase 8** | Documentación Formal | ⏳ Pendiente | Casos de uso, Proceso Unificado y diagramas de arquitectura. |

---

## 💡 4. Reglas Mandatorias para Agentes IA

1. **NO modificar modelos JPA ni la base de datos sin autorización explícita:** Toda optimización de rendimiento o refactor debe realizarse mediante `@EntityGraph`, consultas JPQL optimizadas o servicios, sin alterar esquemas ni clases en `modules/*/model/`.
2. **Anti-1k-Lines:** Ningún archivo debe exceder las 150 líneas de código. Toda vista pesada debe descomponerse en subcomponentes atómicos, custom hooks o archivos de configuración `*.data.ts`.
3. **Cero Git Push:** NUNCA ejecutar `git push`. La sincronización remota está reservada exclusivamente para el usuario.
