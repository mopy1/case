import { useEffect, useMemo, useState } from "react"
import { useEdgesState, useNodesState, type Connection, type Edge, type EdgeChange, type Node } from "@xyflow/react"
import { useDiagram } from "./useDiagram"
import { useEntityMutations } from "./useEntityMutations"
import { useRelationMutations } from "./useRelationMutations"
import { entidadANodo, relacionAArista } from "../lib/diagramMappers"
import { calcularOffsetsParalelos, detectarAsociacionesClase, type AsociacionClase } from "../lib/relacionesDerivadas"
import type { LadoMultiplicidad, PuntoControl, RelacionDiagramaResponse } from "../types/diagram.types"

export type { AsociacionClase }

/** Orquesta el lienzo: nodos/aristas de React Flow + persistencia contra el backend. */
export function useDiagramCanvas(proyectoId: number) {
  const { diagrama, loading, error, refetch } = useDiagram(proyectoId)
  const entityMutations = useEntityMutations(proyectoId)
  const relationMutations = useRelationMutations(proyectoId)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>([])
  const [selectedEntidadId, setSelectedEntidadId] = useState<number | null>(null)

  async function handleDeleteEntity(entidadId: number) {
    await entityMutations.remove(entidadId)
    setSelectedEntidadId((actual) => (actual === entidadId ? null : actual))
    await refetch()
  }

  async function handleDeleteRelation(relacionId: number) {
    await relationMutations.remove(relacionId)
    await refetch()
  }

  /** Se llama al soltar un punto de control (mover/agregar/quitar) — el estado del arrastre en sí
   * es 100% local a `UmlRelationEdge` mientras se mueve, esto solo persiste el resultado final. */
  async function handleMoverPuntosControl(relacionId: number, puntos: PuntoControl[]) {
    const actualizada = await relationMutations.updatePuntosControl(relacionId, puntos)
    if (actualizada) await refetch()
  }

  /** Único punto de borrado de relaciones: seleccionar la línea en el lienzo y apretar
   * Supr/Backspace (ver `deleteKeyCode` en <ReactFlow>). React Flow ya quitó la arista de su
   * propio estado local con `onEdgesChangeRaw`; acá solo se persiste ese borrado. */
  function handleEdgesChange(changes: EdgeChange<Edge>[]) {
    onEdgesChangeRaw(changes)
    for (const change of changes) {
      if (change.type !== "remove") continue
      const relacionId = Number(change.id)
      if (Number.isFinite(relacionId)) handleDeleteRelation(relacionId)
    }
  }

  const { asociaciones, idsFisicasConsumidas } = useMemo(
    () => detectarAsociacionesClase(diagrama),
    [diagrama]
  )
  const idsTablaIntermedia = useMemo(
    () => new Set(asociaciones.map((a) => a.junctionId)),
    [asociaciones]
  )

  useEffect(() => {
    setNodes(
      diagrama.entidades.map((entidad) =>
        entidadANodo(entidad, () => handleDeleteEntity(entidad.id), idsTablaIntermedia.has(entidad.id))
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagrama.entidades, diagrama.relaciones])


  /** Edita un único lado de la relación (click en su "(1..*)") — el otro lado queda tal cual
   * estaba, sin invertir origen/destino (cada lado guarda su propia multiplicidad, ver
   * `RelacionDiagrama.java`). Si el resultado deja ambos lados en "muchos", el backend crea la
   * tabla intermedia como si se hubiera elegido N:M desde el principio. */
  async function handleEditLado(relacion: RelacionDiagramaResponse, lado: "origen" | "destino", nuevoValor: LadoMultiplicidad) {
    const actualizada = await relationMutations.update(relacion.id, {
      entidadOrigenId: relacion.entidadOrigenId,
      entidadDestinoId: relacion.entidadDestinoId,
      multiplicidadOrigen: lado === "origen" ? nuevoValor : relacion.multiplicidadOrigen,
      multiplicidadDestino: lado === "destino" ? nuevoValor : relacion.multiplicidadDestino,
    })
    if (actualizada) await refetch()
  }

  useEffect(() => {
    const offsetsParalelos = calcularOffsetsParalelos(diagrama.relaciones)
    setEdges(
      diagrama.relaciones
        .filter((relacion) => !idsFisicasConsumidas.has(relacion.id))
        .map((relacion) =>
          relacionAArista(
            relacion,
            (lado) => handleEditLado(relacion, "origen", lado),
            (lado) => handleEditLado(relacion, "destino", lado),
            () => handleDeleteRelation(relacion.id),
            (puntos) => handleMoverPuntosControl(relacion.id, puntos),
            offsetsParalelos.get(relacion.id) ?? 0,
            selectedEntidadId != null &&
              (relacion.entidadOrigenId === selectedEntidadId || relacion.entidadDestinoId === selectedEntidadId)
          )
        )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagrama.relaciones, diagrama.entidades, selectedEntidadId])

  async function handleDeleteAsociacion(asociacion: AsociacionClase) {
    await relationMutations.remove(asociacion.relacionOrigenId)
    await relationMutations.remove(asociacion.relacionDestinoId)
    await refetch()
  }

  async function handleCreate(nombre: string) {
    const count = diagrama.entidades.length
    const posX = 80 + (count % 4) * 440
    const posY = 80 + Math.floor(count / 4) * 300
    const creada = await entityMutations.create({ nombre, posX, posY })
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

  function handleNodeClick(_event: unknown, node: Node) {
    setSelectedEntidadId(Number(node.id))
  }

  function handleClearSelection() {
    setSelectedEntidadId(null)
  }

  /** Nace siempre 1:1 (default UML más común); cada punta se ajusta después con click en su
   * "(1)" — incluyendo llevarla hasta N:M, lo que dispara la tabla intermedia. Permite relaciones
   * recursivas (origen === destino, ej. "empleado.jefe_id -> empleado.id") — antes se bloqueaban
   * acá mismo, sin razón real: son un patrón UML válido y el backend nunca las prohibió. */
  async function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) return
    const creada = await relationMutations.create({
      entidadOrigenId: Number(connection.source),
      entidadDestinoId: Number(connection.target),
      multiplicidadOrigen: "UNO",
      multiplicidadDestino: "UNO",
    })
    if (creada) await refetch()
  }

  const selectedEntidad = useMemo(
    () => diagrama.entidades.find((e) => e.id === selectedEntidadId) ?? null,
    [diagrama.entidades, selectedEntidadId]
  )

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange: handleEdgesChange,
    onNodeDragStop: handleNodeDragStop,
    onNodeClick: handleNodeClick,
    onPaneClick: handleClearSelection,
    onConnect: handleConnect,
    onCreate: handleCreate,
    onRenameEntity: handleRenameEntity,
    entidades: diagrama.entidades,
    asociaciones,
    onDeleteAsociacion: handleDeleteAsociacion,
    selectedEntidad,
    selectedEntidadId,
    onClearSelection: handleClearSelection,
    refetch,
    loading,
    error,
    creating: entityMutations.loading,
    createError: entityMutations.error,
  }
}
