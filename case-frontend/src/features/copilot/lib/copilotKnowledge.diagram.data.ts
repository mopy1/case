import type { KnowledgeTopic } from "../types/copilot.types"

export const DIAGRAM_KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: "uml-canvas-entidades",
    title: "Creación y Edición de Entidades en el Lienzo UML",
    section: "diagrama",
    summary: "Cómo crear entidades, renombrarlas y configurar columnas desde el lienzo y panel lateral.",
    content: `**1. Agregar Entidad:** Pulsa el botón **"+ Entidad"** en la barra superior flotante (\`CanvasToolbar\`). Aparecerá una nueva tabla en el lienzo.
**2. Mover Entidades:** Haz clic sostenido en la cabecera de la tabla para arrastrarla libremente.
**3. Panel de Propiedades:** Haz clic sobre cualquier nodo de entidad para abrir el panel lateral derecho (\`EntityPropertiesPanel\`), donde puedes editar el nombre (recomendado PascalCase como \`Usuario\` o \`DetallePedido\`) y gestionar sus atributos.
**4. Persistencia:** Todo cambio en el lienzo se sincroniza automáticamente con el backend.`,
    keywords: ["entidad", "tabla", "crear", "nodo", "lienzo", "canvas", "arrastrar", "mover", "propiedades"],
    sampleQuestions: [
      "¿Cómo creo una nueva entidad o tabla?",
      "¿Cómo editar el nombre de una entidad?",
    ],
  },
  {
    id: "uml-tipos-datos",
    title: "Tipos de Datos SQL y Mapeo Java/Spring Boot",
    section: "diagrama",
    summary: "Los 6 tipos de datos SQL soportados y su correspondencia en Java.",
    content: `La herramienta soporta 6 tipos SQL estrictos que se mapean a Java 21:
• **BIGINT** → \`Long\`: Recomendado para IDs autoincrementales (\`id\`) y claves foráneas.
• **VARCHAR** → \`String\`: Cadenas de texto variables (nombres, correos, descripciones).
• **INTEGER** → \`Integer\`: Números enteros estándar (cantidades, estados numéricos, años).
• **BOOLEAN** → \`Boolean\`: Banderas de estado binarias (activo, habilitado, verificado).
• **TIMESTAMP** → \`LocalDateTime\`: Marcas de fecha/hora (\`created_at\`, \`fecha_registro\`).
• **DECIMAL** → \`BigDecimal\`: Precisión numérica exacta para importes, precios y balances.`,
    keywords: ["tipo de dato", "tipos", "sql", "bigint", "varchar", "integer", "boolean", "timestamp", "decimal", "long", "string"],
    sampleQuestions: [
      "¿Qué tipos de datos soporta?",
      "¿Cómo se mapean los tipos SQL a Java en Spring Boot?",
    ],
    suggestedAdr: {
      accion: "Estandarizar todas las Claves Primarias con tipo BIGINT autoincremental",
      motivo: "Optimizar el rendimiento de operaciones JOIN en PostgreSQL, prevenir desbordamiento de enteros y mapear directamente a Long en Spring Data JPA.",
    },
  },
  {
    id: "uml-pks-fks",
    title: "Claves Primarias (PK) y Claves Foráneas (FK)",
    section: "diagrama",
    summary: "Cómo marcar atributos PK, FK y restricciones de nulabilidad en las tablas.",
    content: `En el modal de atributo (\`AttributeFormDialog\`):
• **Es PK (Primary Key):** Activa el switch "Es PK". Las PKs se ordenan prioritariamente arriba con icono distintivo de llave.
• **Es FK (Foreign Key):** Activa el switch "Es FK" para columnas que referencian a otra tabla.
• **Nullable:** Activa/desactiva si la columna admite valores nulos (\`NULL\` o \`NOT NULL\`).
• Las entidades admiten múltiples atributos con validación de unicidad de nombre.`,
    keywords: ["pk", "fk", "primary key", "foreign key", "clave primaria", "clave foranea", "nullable", "not null"],
    sampleQuestions: [
      "¿Cómo marcar una columna como Primary Key o Foreign Key?",
      "¿Qué significa Nullable en los atributos?",
    ],
  },
  {
    id: "uml-multiplicidades-nm",
    title: "Relaciones, Multiplicidades y Tablas Intermedias N:M",
    section: "diagrama",
    summary: "Conexión entre tablas, multiplicidades (1:1, 1:N, N:M) y generación automática de tabla intermedia.",
    content: `**1. Conectar tablas:** Arrastra desde el conector circular (handle) de una entidad hacia otra.
**2. Multiplicidades:** Selecciona en el badge de la línea: \`0..1\`, \`1..1\`, \`0..*\` o \`1..*\`.
• **1:1:** Asociación uno a uno biunívoca.
• **1:N:** Uno a muchos (ej: \`Cliente\` 1:N \`Pedido\`). Genera \`@ManyToOne\` y \`@OneToMany\` en Spring Boot.
• **N:M (Muchos a Muchos):** Al configurar multiplicidad \`*\` en ambos extremos, el sistema genera automáticamente una **tabla intermedia** (\`AssociationClassOverlay\`) descomponiendo la relación en dos 1:N y creando claves foráneas compuestas.`,
    keywords: ["relacion", "multiplicidad", "cardinalidad", "1:1", "1:n", "n:m", "muchos a muchos", "tabla intermedia", "asociacion"],
    sampleQuestions: [
      "¿Cómo crear una relación N:M?",
      "¿Cómo se generan las tablas intermedias automáticamente?",
    ],
    suggestedAdr: {
      accion: "Normalizar relación N:M mediante tabla intermedia de asociación",
      motivo: "Descomponer la relación muchos a muchos en dos relaciones 1:N hacia una entidad puente para almacenar atributos propios de la transacción y garantizar la 3FN.",
    },
  },
  {
    id: "uml-puntos-control",
    title: "Puntos de Control y Salto Visual de Líneas",
    section: "diagrama",
    summary: "Trazado ortogonal en ángulo recto, arrastre de manijas intermedias y salto en cruces.",
    content: `• **Líneas Ortogonales:** Las aristas (\`UmlRelationEdge\`) trazan trayectorias en ángulo recto buscando la cara más cercana.
• **Puntos de Control:** Arrastra las manijas intermedias (\`PuntoControlHandle\`) para definir quiebres personalizados en la línea y esquivar tablas.
• **Salto de Cruces:** Cuando dos relaciones se cruzan, el motor (\`RelationCrossingOverlay\`) detecta la intersección mediante AABB y dibuja un arco de salto visual para evitar confusiones de conexión.`,
    keywords: ["puntos de control", "aristas", "ortogonal", "angulo recto", "cruces", "salto visual", "lineas", "manijas"],
    sampleQuestions: [
      "¿Cómo se arrastran los puntos de control en las líneas?",
      "¿Por qué se dibuja un salto cuando dos líneas se cruzan?",
    ],
  },
]
