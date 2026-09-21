import { useState, useMemo } from "react"
import type { Node } from "@xyflow/react"
import { findSafeEntityPosition } from "../lib/positionGuide"
import type { DiagramaResponse } from "../types/diagram.types"
import type { useEntityMutations } from "./useEntityMutations"

export function useDiagramEntityActions(
  diagrama: DiagramaResponse,
  entityMutations: ReturnType<typeof useEntityMutations>,
  refetch: () => Promise<unknown>
) {
  const [selectedEntidadId, setSelectedEntidadId] = useState<number | null>(null)

  async function handleCreate(nombre: string) {
    const safePos = findSafeEntityPosition(diagrama.entidades)
    const creada = await entityMutations.create({ nombre, posX: safePos.posX, posY: safePos.posY })
    if (!creada) return false
    await refetch()
    return true
  }

  async function handleNodeDragStop(_event: unknown, node: Node) {
    const entidad = diagrama.entidades.find((e) => String(e.id) === node.id)
    if (!entidad) return
    await entityMutations.update(entidad.id, { nombre: entidad.nombre, posX: node.position.x, posY: node.position.y })
  }

  async function handleRenameEntity(nombre: string) {
    if (!selectedEntidadId) return false
    const entidad = diagrama.entidades.find((e) => e.id === selectedEntidadId)
    if (!entidad) return false
    const actualizada = await entityMutations.update(selectedEntidadId, { nombre, posX: entidad.posX, posY: entidad.posY })
    if (!actualizada) return false
    await refetch()
    return true
  }

  async function handleDeleteEntity(entidadId: number) {
    await entityMutations.remove(entidadId)
    setSelectedEntidadId((actual) => (actual === entidadId ? null : actual))
    await refetch()
  }

  const selectedEntidad = useMemo(
    () => diagrama.entidades.find((e) => e.id === selectedEntidadId) ?? null,
    [diagrama.entidades, selectedEntidadId]
  )

  const handleClear = () => setSelectedEntidadId(null)

  return {
    selectedEntidadId,
    setSelectedEntidadId,
    selectedEntidad,
    onCreate: handleCreate,
    onNodeDragStop: handleNodeDragStop,
    onRenameEntity: handleRenameEntity,
    handleDeleteEntity,
    onNodeClick: (_event: unknown, node: Node) => setSelectedEntidadId(Number(node.id)),
    onPaneClick: handleClear,
    onClearSelection: handleClear,
  }
}
