# 🛠️ CASE Tool — Guía Técnica Global del Repositorio (v1.0)

> **Herramienta CASE Colaborativa (Ingeniería de Software - Parcial 1)**  
> Plataforma web integral para modelado visual de bases de datos relacionales (UML), colaboración en tiempo real, interacción por voz y Copilot IA, interoperabilidad XMI con Enterprise Architect y generación automatizada de proyectos backend en Spring Boot 3.4 (Java 21).

---

## 🗂️ 1. Estructura Real del Monorepo

```text
/home/lmc/projects/sw-case/
├── docker-compose.yml          # Orquestación de desarrollo local (Postgres 5434, Backend 8081, Frontend 5173)
├── docker-compose.prod.yml     # Orquestación de producción para AWS EC2 (Nginx unificado en puerto 80)
├── deploy-aws.sh               # Script automatizado de despliegue en servidor AWS EC2
├── .env                        # Variables de entorno locales
├── .env.example                # Plantilla de variables de entorno
├── AGENTS.md                   # 📌 Esta guía técnica global v1.0
│
├── case-backend/               # ☕ Backend Monolito Modular Spring Boot (Java 21)
│   ├── src/main/java/com/casetool/backend/
│   │   ├── core/               # Seguridad JWT, configuración CORS y manejador global de excepciones
│   │   └── modules/            # Módulos de negocio: seguridad, proyecto, diagrama, xmi
│   ├── Dockerfile              # Construcción multi-etapa con Maven y Eclipse Temurin 21 JRE
│   ├── pom.xml                 # Dependencias Spring Boot, JPA, Postgres, JJWT, SpringDoc OpenAPI
│   └── AGENTS.md               # 📖 Especificación técnica completa del backend
│
└── case-frontend/              # ⚛️ Frontend SPA React 19 + Vite + Tailwind CSS v4
    ├── src/
    │   ├── components/         # Primitivas UI (shadcn / Base UI) y componentes compartidos
    │   ├── features/           # 10 Vertical slices: auth, projects, diagram, tasks, notes,
    │   │                       # xmi, generator, copilot, collaboration, voice
    │   ├── layouts/            # ProjectLayout con riel lateral y Copilot responsivo
    │   ├── lib/                # Cliente apiFetch, avatar y utilidades
    │   └── routes/             # Enrutamiento protegido y público (React Router DOM v7)
    ├── Dockerfile              # Construcción con Node 22 y servicio estático con Nginx Alpine
    ├── nginx.conf              # Configuración de Nginx con Reverse Proxy para /api/
    └── AGENTS.md               # 📖 Especificación técnica completa del frontend
```

---

## 🐳 2. Infraestructura y Modos de Despliegue

### 🏠 Modo Desarrollo Local
* **Base de Datos:** PostgreSQL 16 (`case_postgres`) en puerto host `5434` (base `case_db`).
* **Backend API:** Spring Boot en puerto host `8081`.
* **Frontend Web:** Vite Dev Server en puerto `5173` con HMR o contenedor Nginx.

```bash
# Levantar servicios en Docker local
docker compose up -d

# Desarrollo con Hot Reload en Frontend
cd case-frontend && npm run dev
```

### ☁️ Modo Producción en la Nube (AWS EC2)
* **Arquitectura de Puerto 80 Unificado:** Nginx atiende todo el tráfico HTTP en `http://<IP-AWS>/`.
  * `/` $\rightarrow$ Sirve la SPA de React 19 compilada.
  * `/api/` $\rightarrow$ Reverse Proxy interno hacia `case_backend:8081`.
* **Despliegue automatizado en 1 comando:**
  ```bash
  ./deploy-aws.sh
  ```

---

## 🚦 3. Estado de Módulos del Sistema (v1.0 Listo para Producción)

| Módulo | Alcance Funcional | Estado | Tecnologías Clave |
| :--- | :--- | :---: | :--- |
| **Seguridad & Acceso** | Registro, login, JWT stateless, control de roles (`ADMIN`, `COLABORADOR`, `LECTOR`). | ✅ **1.0** | Spring Security 7, JJWT 0.12.6, BCrypt. |
| **Gestión de Proyectos** | Proyectos, miembros, tareas Kanban (3 columnas) y notas de diseño ADR inmutables. | ✅ **1.0** | PostgreSQL, React Flow, Base UI. |
| **Diagramador UML** | Lienzo de tablas, atributos (PK, FK, tipos SQL), multiplicidades (1:1, 1:N, N:M con tabla intermedia automática), puntos de control ortogonales y salto visual de líneas. | ✅ **1.0** | `@xyflow/react` v12, Floating Edges AABB. |
| **Interoperabilidad XMI**| Exportación e importación compatible con Enterprise Architect (dialectos 1.1 y 2.1). | ✅ **1.0** | DOM XML Parser con blindaje anti-XXE. |
| **Generador Spring Boot** | Generación en cliente de proyectos completos Spring Boot 3.4 (Java 21) empaquetados en ZIP, con JPA, DTOs, Services con inyección foránea, Controllers y Swagger. | ✅ **1.0** | TypeScript, JSZip, FileSaver. |
| **Copilot IA & Control** | Asistente conversacional contextual con manual integrado, control del lienzo (crear tablas, atributos, relaciones), sugerencias ADR y soporte responsivo móvil (Drawer flotante). | ✅ **1.0** | DeepSeek / Gemini API, Regex Parsers. |
| **Colaboración Realtime**| Sincronización multi-usuario, cursores remotos con avatares de color, presencia en vivo y auto-polling silencioso de mutaciones del diagrama. | ✅ **1.0** | `BroadcastChannel` + HTTP Presence API. |
| **Interacción por Voz** | Dictado por voz en español y modo Walkie-Talkie Push-to-Talk con atajo de teclado (`[Espacio]` / `[V]`) y HUD flotante reactivo. | ✅ **1.0** | Web Speech API nativa. |

---

## 💡 4. Reglas Mandatorias para Agentes de IA

1. **Anti-1k-Lines (Límite de líneas):** Ningún archivo de código debe exceder las 150 líneas. Mantener división atómica en componentes, hooks (`use*.ts`) o archivos de configuración (`*.data.ts`).
2. **Integridad de Base de Datos y Modelos JPA:** No modificar esquemas ni entidades JPA sin requerimiento explícito del usuario.
3. **Verificación de Compilación:** Todo cambio en backend debe verificarse con `./mvnw test` o `mvn clean compile`, y en frontend con `npm run build` (0 errores de TypeScript y bundle).
4. **Política de Git:** NUNCA ejecutar `git push`. Realizar únicamente commits locales claros y descriptivos.
