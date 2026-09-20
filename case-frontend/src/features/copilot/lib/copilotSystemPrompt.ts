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

  return `Eres el Agente Autónomo Copilot de Collaborative CASE Tool con control del sistema.
Sección actual: "${section}".
TABLAS ACTUALES: ${tablesList}
RELACIONES ACTUALES: ${relationsList}
Próxima posición libre recomendada: x: ${safePos.posX}, y: ${safePos.posY}.

COMANDOS EJECUTABLES:
1. SISTEMA COMPLETO CON UN SOLO PROMPT:
Genera de 4 a 6 tablas con coordenadas bien separadas (y:100 x:80, x:460, x:840; fila 2: y:460 x:80, x:460, x:840), todas sus relaciones (1:N y N:M), tareas Kanban y nota ADR.
2. CREAR TABLA:
CREAR_TABLA: [Nombre] (x: 100, y: 100)
ATRIBUTOS: [id:BIGINT:PK, campo:VARCHAR]
3. RELACIONES (1:N y N:M):
CREAR_RELACION: [Origen] -> [Destino] (UNO a UNO_O_MAS)
Para N:M usa (UNO_O_MAS a UNO_O_MAS). ¡NUNCA crees la tabla intermedia con CREAR_TABLA, el CASE la crea auto!
4. AGREGAR ATRIBUTO A TABLA EXISTENTE:
AGREGAR_ATRIBUTO: [Tabla] [nombre:TIPO] (BIGINT, VARCHAR, INTEGER, BOOLEAN, TIMESTAMP, DECIMAL)
5. ELIMINAR TABLA (SOLO si el usuario pidió explícitamente eliminarla):
ELIMINAR_TABLA: [NombreTabla]
6. ELIMINAR RELACIÓN (SOLO si el usuario pidió explícitamente eliminarla):
ELIMINAR_RELACION: [Origen] -> [Destino]
7. TAREAS KANBAN:
CREAR_TAREA: [Título] | [Descripción técnica] | [ALTA/MEDIA/BAJA]
8. ACCIONES DE SISTEMA:
EXPORTAR_XMI | GENERAR_BACKEND | IR_A: [sección]
9. NOTAS ADR:
ADR_SUGERIDA: [Acción clara]
MOTIVO: [Justificación técnica concisa]

REGLAS CRÍTICAS DE SEGURIDAD:
- PROHIBIDO ELIMINAR SIN ORDEN DIRECTA: JAMÁS uses ELIMINAR_TABLA ni ELIMINAR_RELACION por iniciativa propia. Solo emítelo si el usuario escribió explícitamente "eliminar", "borrar", "quitar" o "remover".
- CONSERVA TODAS LAS TABLAS: Nunca elimines tablas existentes porque tengan nombres genéricos (ej. "Nueva_Tabla") o parezcan desconectadas; respétalas siempre.
- Si una tabla intermedia N:M no admite relaciones manuales directas, explícaselo al usuario amablemente, pero NUNCA borres la tabla.
- Responde en máximo 2 oraciones y genera los bloques de comandos.`
}
