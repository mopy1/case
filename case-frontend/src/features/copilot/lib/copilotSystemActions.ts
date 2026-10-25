import { createTask } from "@/features/tasks/api/tasksApi"
import { deleteRelation, getDiagram } from "@/features/diagram/api/diagramApi"
import { exportXmi } from "@/features/xmi/api/xmiApi"
import { generarProyectoSpringBoot } from "@/features/generator/lib/springBootGenerator"
import { descargarProyectoZip } from "@/features/generator/lib/zipExporter"
import { descargarBlob } from "@/lib/descargarArchivo"
import { notificarExportacion } from "@/features/guia"
import type { TaskSuggestion } from "../types/copilot.types"

export async function executeCreateTaskAction(
  proyectoId: number,
  task: TaskSuggestion
): Promise<void> {
  const creada = await createTask(proyectoId, {
    titulo: task.titulo,
    descripcion: task.descripcion,
    prioridad: task.prioridad || "MEDIA",
    usuarioId: null,
  })
  window.dispatchEvent(new CustomEvent("project:task-created", { detail: { proyectoId, task: creada } }))
}

export async function executeDeleteRelationByName(
  proyectoId: number,
  origenNombre: string,
  destinoNombre: string
): Promise<void> {
  const diagram = await getDiagram(proyectoId)
  const origen = diagram.entidades.find(
    (e) => e.nombre.trim().toLowerCase() === origenNombre.trim().toLowerCase()
  )
  const destino = diagram.entidades.find(
    (e) => e.nombre.trim().toLowerCase() === destinoNombre.trim().toLowerCase()
  )

  if (!origen || !destino) return

  const rel = diagram.relaciones.find(
    (r) =>
      (r.entidadOrigenId === origen.id && r.entidadDestinoId === destino.id) ||
      (r.entidadOrigenId === destino.id && r.entidadDestinoId === origen.id)
  )

  if (!rel) return

  await deleteRelation(proyectoId, rel.id)
  window.dispatchEvent(new CustomEvent("project:diagram-updated", { detail: { proyectoId } }))
}

export async function executeExportXmiAction(proyectoId: number): Promise<void> {
  const blob = await exportXmi(proyectoId)
  descargarBlob(blob, `diagrama-${proyectoId}.xmi`)
  notificarExportacion(proyectoId, "xmi")
}

export async function executeGenerateBackendAction(proyectoId: number): Promise<void> {
  const diagram = await getDiagram(proyectoId)
  const preview = generarProyectoSpringBoot(`backend-${proyectoId}`, diagram)
  await descargarProyectoZip(preview.archivos, proyectoId)
  notificarExportacion(proyectoId, "backend")
}
