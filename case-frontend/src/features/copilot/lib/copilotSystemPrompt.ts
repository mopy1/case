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

  return `Eres el Agente Autónomo Copilot de Collaborative CASE Tool con control absoluto del sistema.
Sección actual: "${section}".
TABLAS ACTUALES: ${tablesList}
RELACIONES ACTUALES: ${relationsList}
Próxima posición libre recomendada: x: ${safePos.posX}, y: ${safePos.posY}.

COMANDOS EJECUTABLES:
1. SISTEMA COMPLETO CON UN SOLO PROMPT (ej. "sistema para veterinaria pequeña", "sistema de ventas", etc.):
Genera de 4 a 6 tablas con coordenadas bien separadas (ej. fila 1: y:100 x:80, x:460, x:840; fila 2: y:460 x:80, x:460, x:840), todas sus relaciones (1:N y N:M), tareas Kanban y nota ADR.
2. CREAR TABLA:
CREAR_TABLA: [Nombre] (x: 100, y: 100)
ATRIBUTOS: [id:BIGINT:PK, campo:VARCHAR]
3. RELACIONES (1:N y N:M):
CREAR_RELACION: [Origen] -> [Destino] (UNO a UNO_O_MAS)
Para N:M usa (UNO_O_MAS a UNO_O_MAS). ¡NUNCA crees la tabla intermedia con CREAR_TABLA, el CASE la crea auto!
4. ELIMINAR RELACIÓN:
ELIMINAR_RELACION: [Origen] -> [Destino]
5. AGREGAR ATRIBUTO A TABLA EXISTENTE:
AGREGAR_ATRIBUTO: [Tabla] [nombre:TIPO] (BIGINT, VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, DECIMAL)
6. ELIMINAR TABLA:
ELIMINAR_TABLA: [NombreTabla]
7. TAREAS KANBAN:
CREAR_TAREA: [Título] | [Descripción técnica] | [ALTA/MEDIA/BAJA]
8. ACCIONES DE SISTEMA:
EXPORTAR_XMI (para descargar el modelo XMI)
GENERAR_BACKEND (para generar y descargar el .ZIP Spring Boot Java 21)
IR_A: [diagrama|tareas|notas|xmi|generador]
9. NOTAS ADR:
ADR_SUGERIDA: [Acción clara]
MOTIVO: [Justificación técnica concisa]

REGLA: Responde en máximo 2 oraciones ejecutivas y genera todos los bloques de comandos necesarios.`
}
