# 🤖 Guía Técnica de Arquitectura Backend — CASE Tool (Spring Boot)

> **Documento para Agentes de IA y Desarrolladores.**  
> Esta guía define el estado actual, la estructura de código, las convenciones de diseño y las reglas operativas del backend. **No es un registro histórico; es la especificación técnica viva del sistema.**

---

## 🎯 1. Propósito y Stack Tecnológico

El backend proporciona la API REST para una **Herramienta CASE Colaborativa** enfocada en el diseño UML de bases de datos relacionales, gestión de proyectos, interoperabilidad XMI y generación de código Spring Boot.

- **Lenguaje:** Java 21 (LTS)
- **Framework:** Spring Boot 4.1.1 / Spring Framework 7.x
- **Persistencia:** Spring Data JPA + Hibernate ORM (PostgreSQL Dialect)
- **Base de Datos:** PostgreSQL 16 (contenedor `case_postgres` en puerto `5434`, base `case_db`)
- **Seguridad:** Spring Security 7 + JWT (JJWT `0.12.6`) sin estado (`STATELESS`)
- **Procesamiento XML:** DOM Parser con protección XXE (`disallow-doctype-decl`)
- **Build Tool:** Maven (wrapper `./mvnw`)

---

## 🏗️ 2. Estructura Real del Código Fuente

```text
case-backend/src/main/java/com/casetool/backend/
├── CaseBackendApplication.java               # Punto de entrada de la aplicación Spring Boot
│
├── core/                                     # 🌐 Infraestructura transversal compartida
│   ├── config/
│   │   └── CorsConfig.java                   # Orígenes permitidos (localhost:5173), métodos (GET, POST, PUT, PATCH, DELETE)
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java       # @RestControllerAdvice mapeando excepciones a respuestas HTTP semánticas
│   │   └── ResourceNotFoundException.java    # Excepción estándar para recursos 404
│   └── security/
│       ├── JwtAuthenticationEntryPoint.java  # Retorna 401 Unauthorized explícito (evita 403 ambiguo en token inválido/ausente)
│       ├── JwtAuthenticationFilter.java      # Filtro OncePerRequest con validación criptográfica en una sola pasada
│       ├── JwtService.java                   # Generación y validación de tokens con SecretKey HMAC precalculada en bean
│       └── SecurityConfig.java               # SecurityFilterChain, PasswordEncoder (BCrypt), AuthenticationManager
│
└── modules/                                  # 🚀 Módulos de Negocio (Monolito Modular)
    ├── seguridad/                            # 🔑 Autenticación y Gestión de Usuarios
    │   ├── controller/   AuthController.java (/api/v1/auth/login, /register, /me)
    │   ├── dto/          AuthResponse, LoginRequest, RegisterRequest, UsuarioResponse
    │   ├── exception/    CredencialesInvalidasException (401), RecursoDuplicadoException (409)
    │   ├── model/        Usuario, UsuarioPrincipal (implementa UserDetails, expone getId())
    │   ├── repository/   UsuarioRepository (findByUsername, findByEmail, existsBy...)
    │   └── service/      AuthService, UsuarioDetailsService
    │
    ├── proyecto/                             # 📁 Proyectos, Miembros, Tareas y Notas
    │   ├── controller/   ProyectoController, MiembroProyectoController, TareaProyectoController, NotaProyectoController
    │   ├── dto/          ProyectoRequest/Response, MiembroProyectoRequest/Response, TareaProyectoRequest/Response, etc.
    │   ├── exception/    AccesoDenegadoProyectoException (403), RolInsuficienteProyectoException (403), MiembroYaExisteException (409)
    │   ├── model/        Proyecto, MiembroProyecto (Rol: ADMIN, COLABORADOR, LECTOR), TareaProyecto, NotaProyecto
    │   ├── repository/   ProyectoRepository, MiembroProyectoRepository (@EntityGraph), TareaProyectoRepository, NotaProyectoRepository
    │   └── service/      ProyectoService, MiembroProyectoService, TareaProyectoService, NotaProyectoService, ProyectoAccesoService
    │
    ├── diagrama/                             # 📐 Lienzo UML (Tablas, Columnas, Relaciones)
    │   ├── controller/   DiagramaController, EntidadDiagramaController, AtributoEntidadController, RelacionDiagramaController
    │   ├── dto/          DiagramaResponse, EntidadDiagramaRequest/Response, AtributoEntidadRequest/Response, RelacionDiagramaRequest/Response, etc.
    │   ├── exception/    NombreDuplicadoDiagramaException (409)
    │   ├── model/        EntidadDiagrama, AtributoEntidad, RelacionDiagrama (puntosControl JSON), PuntoControl
    │   ├── repository/   EntidadDiagramaRepository, AtributoEntidadRepository (batch fetch por proyecto), RelacionDiagramaRepository (@EntityGraph)
    │   └── service/      DiagramaService (carga O(1) en memoria sin N+1), EntidadDiagramaService, AtributoEntidadService, RelacionDiagramaService
    │
    ├── xmi/                                  # 🔄 Interoperabilidad XMI con Enterprise Architect
    │   ├── controller/   XmiController (/api/proyectos/{id}/xmi/exportar, /importar)
    │   └── service/      XmiExportService (emite XMI 1.1 EA con AssociationClass), XmiImportService (parser dual EA y XMI 2.1)
    │
    └── generator/                            # ⚡ Motor Generador de Backend Spring Boot (Fase 4)
        ├── controller/   GeneradorController (/api/proyectos/{id}/generador/preview, /descargar)
        ├── dto/          ArchivoGeneradoDto, GeneradorPreviewResponse
        └── service/      GeneradorService (traductor de diagrama a Java 21 / Spring Boot 3.4 y empaquetador ZIP)
```

---

## 📐 3. Convenciones Mandatorias de Arquitectura

1. **Subpaquetes Canónicos por Módulo:**
   Todo módulo de negocio nuevo debe replicar estrictamente:
   `controller` | `dto` | `exception` | `model` | `repository` | `service`.
   Las excepciones específicas de negocio van en el subpaquete `exception` del módulo, no en `core/exception`.

2. **Convención de Idioma:**
   - **Dominio y Base de Datos:** Español (`Usuario`, `Proyecto`, `MiembroProyecto`, `EntidadDiagrama`, `AtributoEntidad`).
   - **Sufijos Técnicos y Clases de Soporte:** Inglés (`Request`, `Response`, `Service`, `Controller`, `Repository`, `Config`).

3. **Seguridad y Control de Acceso:**
   - El id del usuario autenticado se extrae de `UsuarioPrincipal` vía `@AuthenticationPrincipal UsuarioPrincipal principal` sin consultar la base de datos.
   - La autorización de miembros y roles se centraliza en `ProyectoAccesoService.validarAcceso(proyectoId, usuarioId, rolRequerido)` (`ADMIN` > `COLABORADOR` > `LECTOR`).
   - Protección de único Administrador: no es posible eliminar ni degradar de rol al último `ADMIN` de un proyecto.

4. **Performance y Prevención de N+1 (JPA):**
   - Prohibido hacer bucles que ejecuten queries JPA individuales (`1 + N`).
   - La aristas y membresías usan `@EntityGraph(attributePaths = {...})` en sus repositorios para realizar `JOIN FETCH` automáticos.
   - En [`DiagramaService.java`](file:///home/lmc/projects/sw-case/case-backend/src/main/java/com/casetool/backend/modules/diagrama/service/DiagramaService.java), el lienzo completo se resuelve en **3 consultas exactas**, agrupando atributos en memoria mediante `Collectors.groupingBy`.

5. **Reglas de Integridad Referencial:**
   - Borrado en Cascada: `MiembroProyecto`, `NotaProyecto`, `TareaProyecto` y `EntidadDiagrama` tienen `@OnDelete(action = OnDeleteAction.CASCADE)` a nivel base de datos hacia `Proyecto`.
   - Claves foráneas del diagrama (`AtributoEntidad.referenciaEntidad`): protegidas con `RESTRICT` para evitar dejar punteros huérfanos.

---

## 📡 4. Contrato de API REST

Todos los endpoints están bajo el prefijo `/api/v1` y exigen encabezado `Authorization: Bearer <token>` excepto `/auth/register` y `/auth/login`.

| Módulo | Método | Endpoint | Rol Requerido | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Público | Registro de usuario nuevo |
| **Auth** | `POST` | `/api/v1/auth/login` | Público | Inicio de sesión, retorna token JWT |
| **Auth** | `GET` | `/api/v1/auth/me` | Autenticado | Obtiene datos del usuario en sesión actual |
| **Proyectos** | `GET` | `/api/v1/proyectos` | Autenticado | Lista los proyectos donde el usuario es miembro |
| **Proyectos** | `POST` | `/api/v1/proyectos` | Autenticado | Crea proyecto (creador se asigna como `ADMIN`) |
| **Proyectos** | `GET` | `/api/v1/proyectos/{id}` | LECTOR | Detalle de un proyecto |
| **Proyectos** | `PUT` | `/api/v1/proyectos/{id}` | ADMIN | Edita nombre o descripción |
| **Proyectos** | `DELETE`| `/api/v1/proyectos/{id}` | ADMIN | Borra proyecto completo con borrado en cascada |
| **Miembros** | `GET` | `/api/v1/proyectos/{id}/miembros` | LECTOR | Lista colaboradores y sus roles |
| **Miembros** | `POST` | `/api/v1/proyectos/{id}/miembros` | ADMIN | Agrega colaborador por username o email |
| **Miembros** | `PUT` | `/api/v1/proyectos/{id}/miembros/{usuarioId}/rol` | ADMIN | Cambia rol (`ADMIN`, `COLABORADOR`, `LECTOR`) |
| **Miembros** | `DELETE`| `/api/v1/proyectos/{id}/miembros/{usuarioId}` | ADMIN | Desvincula colaborador (protege al último admin) |
| **Tareas** | `GET` | `/api/v1/proyectos/{id}/tareas` | LECTOR | Lista tareas del proyecto |
| **Tareas** | `POST` | `/api/v1/proyectos/{id}/tareas` | COLABORADOR | Crea tarea (`PENDIENTE`, `EN_PROCESO`, `COMPLETADA`) |
| **Tareas** | `PATCH`| `/api/v1/proyectos/{id}/tareas/{id}/estado` | COLABORADOR | Actualiza únicamente el estado de la tarea |
| **Tareas** | `DELETE`| `/api/v1/proyectos/{id}/tareas/{id}` | COLABORADOR | Elimina tarea |
| **Notas** | `GET` | `/api/v1/proyectos/{id}/notas` | LECTOR | Timeline de decisiones de diseño |
| **Notas** | `POST` | `/api/v1/proyectos/{id}/notas` | COLABORADOR | Registra nota inmutable con motivo obligatorio |
| **Diagrama** | `GET` | `/api/v1/proyectos/{id}/diagrama` | LECTOR | Retorna entidades, atributos y relaciones juntas |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/entidades` | COLABORADOR | Crea tabla en el lienzo |
| **Diagrama** | `PUT` | `/api/v1/proyectos/{id}/entidades/{id}` | COLABORADOR | Actualiza nombre y coordenadas `pos_x`/`pos_y` |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/entidades/{id}` | COLABORADOR | Elimina tabla (si no está referenciada por FK) |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/entidades/{id}/atributos` | COLABORADOR | Añade atributo (PK, FK, nullable, tipo SQL) |
| **Diagrama** | `PUT` | `/api/v1/proyectos/{id}/entidades/{id}/atributos/{atId}` | COLABORADOR | Modifica atributo |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/entidades/{id}/atributos/{atId}` | COLABORADOR | Elimina atributo |
| **Diagrama** | `POST` | `/api/v1/proyectos/{id}/relaciones` | COLABORADOR | Crea relación con multiplicidad por extremo |
| **Diagrama** | `PATCH`| `/api/v1/proyectos/{id}/relaciones/{id}/puntos` | COLABORADOR | Guarda puntos de control de la polilínea |
| **Diagrama** | `DELETE`| `/api/v1/proyectos/{id}/relaciones/{id}` | COLABORADOR | Elimina relación |
| **XMI** | `GET` | `/api/proyectos/{id}/xmi/exportar` | LECTOR | Descarga XML en formato XMI 1.1 (Enterprise Architect) |
| **XMI** | `POST` | `/api/proyectos/{id}/xmi/importar` | COLABORADOR | Carga archivo XMI (soporta EA y dialecto XMI 2.1) |
| **Generador** | `GET` | `/api/proyectos/{id}/generador/preview` | LECTOR | Retorna árbol de archivos Java, DTOs y configuración generada |
| **Generador** | `GET` | `/api/proyectos/{id}/generador/descargar` | LECTOR | Descarga proyecto Spring Boot 3.4 / Java 21 compilable en `.zip` |

---

## 🚦 5. Matriz de Estado de Fases

- [x] **Fase 1 (Fundación):** Auth JWT, Monolito Modular, CRUD de Proyectos, Colaboradores con roles, Tareas Kanban y Notas.
- [x] **Fase 2 (Diagramador UML):** Entidades, Atributos, Relaciones con multiplicidad, Tablas intermedias automáticas para N:M, Puntos de control.
- [x] **Fase 3 (Interoperabilidad XMI):** Exportador e Importador compatible con Enterprise Architect probado con modelos reales (`erp_bolivia.xmi`).
- [x] **Fase 4 (Generador Spring Boot):** Generación de proyecto Java backend en ZIP compilable a partir del diagrama modelado (Entity, Repository, DTOs, Service, Controller, OpenAPI Swagger, CorsConfig, pom.xml).
- [ ] **Fase 5 (Modos Alternativos):** Control por voz (5.1) y Visión por foto a modelo UML (5.2).
- [ ] **Fase 6 (Colaboración en Tiempo Real):** WebSocket / STOMP para edición concurrente y cursores compartidos.

---

## 💡 6. Reglas Operativas para Agentes IA (Do's & Don'ts)

1. **NO alterar la base de datos ni modelos JPA sin orden explícita del usuario:** No modificar archivos bajo `modules/*/model/` ni aplicar DDLs destructivos en PostgreSQL.
2. **Pruebas Locales con Maven:**  
   Para compilar y correr pruebas unitarias/integración contra la base de datos en Docker:
   ```bash
   ./mvnw test -Dspring.datasource.url=jdbc:postgresql://localhost:5434/case_db -Dspring.datasource.username=case_user -Dspring.datasource.password=case_dev_pw123
   ```
3. **Cero Git Push:** NUNCA ejecutar `git push`. Las modificaciones solo se guardan con commits locales para que el usuario realice el push manualmente.
4. **Respuestas de error:** Si se captura una falta de autorización o membresía, arrojar las excepciones del paquete `modules/proyecto/exception/` para que `GlobalExceptionHandler` retorne `403 Forbidden` semántico.
