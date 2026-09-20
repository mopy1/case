import type { KnowledgeTopic } from "../types/copilot.types"
import { DIAGRAM_KNOWLEDGE_TOPICS } from "./copilotKnowledge.diagram.data"

export const PROJECT_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: "notas-adrs",
    title: "Decisiones Arquitectónicas (ADRs) y Justificación",
    section: "notas",
    summary: "Qué son las Architecture Decision Records y cómo justificar el diseño ante el docente.",
    content: `Las **ADRs (Architecture Decision Records)** registran formalmente las elecciones de diseño:
• **Acción:** Qué se decidió implementar (ej: *"Normalizar Pedido y DetallePedido"* o *"Usar BIGINT en PKs"*).
• **Motivo Técnico:** Justificación basada en normalización (3FN), rendimiento, escalabilidad o patrones SOLID.
• **Inmutabilidad:** Las notas son inmutables para garantizar trazabilidad histórica y auditoría ante el docente o equipo.
• **Integración Directa:** Puedes guardar cualquier sugerencia de la IA en este panel haciendo clic en **"📝 Guardar como Nota ADR en el proyecto"**.`,
    keywords: ["nota", "adr", "decision", "arquitectura", "justificar", "docente", "motivo", "accion", "inmutable"],
    sampleQuestions: [
      "¿Qué es un ADR y por qué es inmutable?",
      "¿Cómo justificar decisiones de arquitectura ante el docente?",
    ],
    suggestedAdr: {
      accion: "Documentar decisiones de arquitectura como registros ADR inmutables",
      motivo: "Asegurar la trazabilidad histórica del diseño relacional y justificar la normalización y patrones ante revisiones académicas y técnicas.",
    },
  },
  {
    id: "tareas-kanban",
    title: "Tablero Kanban de Tareas del Backend",
    section: "tareas",
    summary: "Gestión ágil de tareas por estado, prioridad y asignación de colaboradores.",
    content: `El tablero organiza las actividades pendientes vinculadas a las entidades del proyecto:
• **Columnas:** *Pendiente*, *En Proceso* y *Completada*.
• **Prioridad:** Clasificación visual por prioridad (*Alta*, *Media*, *Baja*).
• **Colaboradores:** Asignación directa a miembros del proyecto con sus avatares.
• **Transición:** Mueve tarjetas entre columnas con un solo clic según avance el sprint.`,
    keywords: ["tarea", "kanban", "tablero", "pendiente", "proceso", "completada", "prioridad", "backlog"],
    sampleQuestions: [
      "¿Cómo organizar el backlog del backend?",
      "¿Cómo vincular tareas a los colaboradores del proyecto?",
    ],
  },
  {
    id: "xmi-interoperabilidad",
    title: "Interoperabilidad XMI 2.1 con Enterprise Architect 16",
    section: "xmi",
    summary: "Exportación e importación de modelos UML en formato XML estándar XMI.",
    content: `**Exportar a Enterprise Architect 16:**
1. Ve a la pestaña **XMI** y pulsa **"Exportar XMI"**. Se descargará un archivo \`.xmi\` estándar UML 2.1.
2. En EA 16: Clic derecho en un paquete → \`Import/Export\` → \`Import Package from XMI...\` y selecciona el archivo.

**Importar desde Enterprise Architect 16:**
1. En EA 16: Exporta tu diagrama de clases como XMI 1.1 o 2.1 (\`Export Package to XMI\`).
2. En la CASE Tool: Ve a la pestaña **XMI**, pulsa **"Importar XMI"** y sube el archivo. El motor mapeará automáticamente clases, atributos y relaciones al lienzo.`,
    keywords: ["xmi", "enterprise architect", "ea", "exportar", "importar", "xml", "uml 2.1", "interoperabilidad"],
    sampleQuestions: [
      "¿Cómo importar este XMI en Enterprise Architect?",
      "¿Cómo exportar el diagrama para Enterprise Architect 16?",
    ],
  },
  {
    id: "generador-spring-boot",
    title: "Generador de Backend Spring Boot 3.4 / Java 21 (Fase 4)",
    section: "generador",
    summary: "Generación 100% client-side de arquitectura limpia en capas y descarga en ZIP.",
    content: `El generador produce un proyecto Maven completo y compilable al 100%:
• **Stack:** Spring Boot 3.4.x, Java 21 LTS, Spring Data JPA, PostgreSQL Driver, Lombok y Validation.
• **Capas Generadas:**
  - \`@Entity\`: Clases con \`@Table\`, \`@Id\`, mapeo de tipos y relaciones \`@ManyToOne\` / \`@OneToMany\`.
  - \`@Repository\`: Interfaces \`JpaRepository<Entidad, Long>\` con CRUD y paginación.
  - **DTOs:** Records \`CreateRequest\`, \`UpdateRequest\` y \`Response\` inmutables.
  - \`@Service\`: Servicios transaccionales con lógica de negocio y validaciones.
  - \`@RestController\`: Endpoints RESTful con verbos HTTP y rutas versionadas \`/api/v1/...\`.
  - **Manejador Global:** \`@RestControllerAdvice\` para respuestas de error estándar JSON.
• **Ejecución:** Descomprime el ZIP y corre: \`./mvnw spring-boot:run\` o \`mvn spring-boot:run\`.`,
    keywords: ["generador", "spring boot", "java 21", "pom.xml", "zip", "backend", "entity", "repository", "service", "controller", "dto"],
    sampleQuestions: [
      "¿Qué dependencias incluye el pom.xml?",
      "¿Cómo ejecuto el backend descargado?",
      "¿Qué capas de código genera?",
    ],
    suggestedAdr: {
      accion: "Desacoplar entidades JPA de los endpoints REST mediante DTOs y Servicios Transaccionales",
      motivo: "Evitar fuga del modelo de datos de persistencia, proteger contra vulnerabilidades Over-Posting y garantizar transacciones ACID.",
    },
  },
  {
    id: "sistema-temas",
    title: "Soporte de Tema Oscuro y Claro",
    section: "general",
    summary: "Conmutación ergonómica de temas con persistencia y adaptación de React Flow.",
    content: `• Puedes alternar entre modo oscuro y claro con el icono de sol/luna (\`ThemeToggle\`) en la barra lateral fija (\`ProjectNavRail\`).
• Todos los componentes, incluido el lienzo de diagramación React Flow, el minimapa y el generador de código, adaptan automáticamente sus tokens de color y contraste.`,
    keywords: ["tema", "oscuro", "claro", "dark mode", "light mode", "colores", "apariencia"],
    sampleQuestions: [
      "¿Cómo cambiar entre modo oscuro y claro?",
      "¿El lienzo UML soporta modo claro?",
    ],
  },
]

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  ...DIAGRAM_KNOWLEDGE_TOPICS,
  ...PROJECT_KNOWLEDGE_TOPICS,
]
