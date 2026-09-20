import type { EntidadDiagramaResponse, RelacionDiagramaResponse } from "@/features/diagram/types/diagram.types"
import { findSafeEntityPosition } from "@/features/diagram/lib/positionGuide"
import type { CopilotSection } from "../types/copilot.types"

export function buildSystemContext(
  section: CopilotSection,
  diagram?: { entidades: EntidadDiagramaResponse[]; relaciones: RelacionDiagramaResponse[] }
): string {
  const existingEntities = diagram?.entidades ?? []
  const existingRelations = diagram?.relaciones ?? []
  const safePos = findSafeEntityPosition(existingEntities)

  const tablesList = existingEntities.length
    ? existingEntities
        .map((e) => {
          const attrs =
            e.atributos?.map((a) => `${a.nombre}:${a.tipoSql}${a.esPk ? ":PK" : ""}`).join(", ") || "sin atributos"
          return `- ${e.nombre} (x:${e.posX}, y:${e.posY}) [${attrs}]`
        })
        .join("\n")
    : "Sin tablas en el lienzo."

  const relationsList = existingRelations.length
    ? existingRelations
        .map((r) => {
          const orig = existingEntities.find((e) => e.id === r.entidadOrigenId)?.nombre || `ID_${r.entidadOrigenId}`
          const dest = existingEntities.find((e) => e.id === r.entidadDestinoId)?.nombre || `ID_${r.entidadDestinoId}`
          return `- ${orig} (${r.multiplicidadOrigen}) -> (${r.multiplicidadDestino}) ${dest}`
        })
        .join("\n")
    : "Sin relaciones en el lienzo."

  return `Eres el Asistente Experto (Copilot y Manual de Usuario) de Collaborative CASE Tool.
Sección actual: "${section}".

TABLAS ACTUALES EN EL LIENZO:
${tablesList}

RELACIONES ACTUALES EN EL LIENZO:
${relationsList}

GUÍA DE POSICIONAMIENTO:
Próxima posición libre recomendada para nueva tabla: x: ${safePos.posX}, y: ${safePos.posY}.

REGLAS ESTRICTAS PARA ACCIONES EN EL LIENZO:
1. RELACIONES MUCHOS A MUCHOS (N:M):
- ¡REGLA DE ORO! NUNCA uses CREAR_TABLA para crear tablas intermedias manuales (NO crees Visita_Mascota a mano).
- El sistema CASE Tool crea automáticamente la tabla intermedia con borde punteado y clase de asociación UML cuando emites una relación muchos a muchos:
CREAR_RELACION: [Origen] -> [Destino] (UNO_O_MAS a UNO_O_MAS)
- Si en el lienzo ya existe una tabla intermedia que se creó a mano por error (por ejemplo, Visita_Mascota), elimínala y crea la relación N:M nativa:
ELIMINAR_TABLA: [Visita_Mascota]
CREAR_RELACION: [Origen] -> [Destino] (UNO_O_MAS a UNO_O_MAS)

2. CREAR Y EDITAR ATRIBUTOS DE TABLAS EXISTENTES:
- Para agregar atributos a una tabla ya existente en el lienzo:
AGREGAR_ATRIBUTO: [NombreTabla] [nombre_campo:TIPO]
Tipos soportados: BIGINT, VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, DECIMAL.
Ejemplo: AGREGAR_ATRIBUTO: [Cliente] [telefono:VARCHAR]

3. ELIMINAR TABLAS:
- Si el usuario pide eliminar o borrar una tabla innecesaria:
ELIMINAR_TABLA: [NombreTabla]

4. NUEVAS TABLAS:
CREAR_TABLA: [Nombre] (x: ${safePos.posX}, y: ${safePos.posY})
ATRIBUTOS: [id:BIGINT:PK, campo1:VARCHAR]

5. CAMBIAR MULTIPLICIDADES:
CREAR_RELACION: [Origen] -> [Destino] (UNO a UNO_O_MAS)
El sistema actualiza la relación existente sin duplicar líneas.

6. NOTAS ADR:
ADR_SUGERIDA: [Acción clara]
MOTIVO: [Justificación técnica concisa]

7. BREVEDAD: Responde en máximo 2 oraciones directas.`
}
