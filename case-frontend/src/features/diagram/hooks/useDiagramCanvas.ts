import { useEffect, useMemo } from "react"
import { useEdgesState, useNodesState, type Connection, type Edge, type EdgeChange, type Node } from "@xyflow/react"
import { useDiagram } from "./useDiagram"
import { useEntityMutations } from "./useEntityMutations"
import { useRelationMutations } from "./useRelationMutations"
import { useDiagramEntityActions } from "./useDiagramEntityActions"
import { entidadANodo, relacionAArista } from "../lib/diagramMappers"
import { calcularOffsetsParalelos, detectarAsociacionesClase, type AsociacionClase } from "../lib/relacionesDerivadas"
import type { LadoMultiplicidad, PuntoControl, RelacionDiagramaResponse, TipoRelacionUml } from "../types/diagram.types"

export type { AsociacionClase }

export function useDiagramCanvas(proyectoId: number) {
  const { diagrama, loading, error, refetch } = useDiagram(proyectoId)
  const entityMutations = useEntityMutations(proyectoId)
  const relationMutations = useRelationMutations(proyectoId)
  const entityActions = useDiagramEntityActions(diagrama, entityMutations, refetch)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<Edge>([])

  async function handleDeleteRelation(relacionId: number) {
    await relationMutations.remove(relacionId)
    await refetch()
  }

  async function handleMoverPuntosControl(relacionId: number, puntos: PuntoControl[]) {
    const actualizada = await relationMutations.updatePuntosControl(relacionId, puntos)
    if (actualizada) await refetch()
  }

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
        entidadANodo(entidad, () => entityActions.handleDeleteEntity(entidad.id), idsTablaIntermedia.has(entidad.id))
      )
    )
  }, [diagrama.entidades, diagrama.relaciones, idsTablaIntermedia, setNodes])

  async function handleEditLado(relacion: RelacionDiagramaResponse, lado: "origen" | "destino", nuevoValor: LadoMultiplicidad) {
    const actualizada = await relationMutations.update(relacion.id, {
      entidadOrigenId: relacion.entidadOrigenId,
      entidadDestinoId: relacion.entidadDestinoId,
      multiplicidadOrigen: lado === "origen" ? nuevoValor : relacion.multiplicidadOrigen,
      multiplicidadDestino: lado === "destino" ? nuevoValor : relacion.multiplicidadDestino,
      tipo: relacion.tipo,
    })
    if (actualizada) await refetch()
  }

  async function handleEditTipo(relacion: RelacionDiagramaResponse, nuevoTipo: TipoRelacionUml) {
    const actualizada = await relationMutations.update(relacion.id, {
      entidadOrigenId: relacion.entidadOrigenId,
      entidadDestinoId: relacion.entidadDestinoId,
      multiplicidadOrigen: relacion.multiplicidadOrigen,
      multiplicidadDestino: relacion.multiplicidadDestino,
      tipo: nuevoTipo,
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
            (tipo) => handleEditTipo(relacion, tipo),
            () => handleDeleteRelation(relacion.id),
            (puntos) => handleMoverPuntosControl(relacion.id, puntos),
            offsetsParalelos.get(relacion.id) ?? 0,
            entityActions.selectedEntidadId != null &&
              (relacion.entidadOrigenId === entityActions.selectedEntidadId || relacion.entidadDestinoId === entityActions.selectedEntidadId)
          )
        )
    )
  }, [diagrama.relaciones, idsFisicasConsumidas, entityActions.selectedEntidadId, setEdges])

  async function handleDeleteAsociacion(asociacion: AsociacionClase) {
    await relationMutations.remove(asociacion.relacionOrigenId)
    await relationMutations.remove(asociacion.relacionDestinoId)
    await refetch()
  }

  async function handleConnect(connection: Connection) {
    if (!connection.source || !connection.target) return
    const creada = await relationMutations.create({
      entidadOrigenId: Number(connection.source),
      entidadDestinoId: Number(connection.target),
      multiplicidadOrigen: "UNO",
      multiplicidadDestino: "UNO",
      tipo: "ASOCIACION",
    })
    if (creada) await refetch()
  }

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    asociaciones,
    onDeleteAsociacion: handleDeleteAsociacion,
    entidades: diagrama.entidades,
    refetch,
    loading,
    error,
    creating: entityMutations.loading,
    createError: entityMutations.error,
    ...entityActions,
  }
}
