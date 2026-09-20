import { useParams } from "react-router-dom"
import { Background, ConnectionMode, Controls, MiniMap, ReactFlow, type EdgeTypes, type NodeTypes } from "@xyflow/react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useTheme } from "@/contexts/ThemeContext"
import { useDiagramCanvas } from "../hooks/useDiagramCanvas"
import { CanvasToolbar } from "../components/toolbar/CanvasToolbar"
import { EntityNode } from "../components/nodes/EntityNode"
import { UmlRelationEdge } from "../components/edges/UmlRelationEdge"
import { AssociationClassOverlay } from "../components/edges/AssociationClassOverlay"
import { RelationCrossingOverlay } from "../components/edges/RelationCrossingOverlay"
import { EntityPropertiesPanel } from "../components/panel/entity-properties-panel"

const nodeTypes: NodeTypes = { entidad: EntityNode }
const edgeTypes: EdgeTypes = { relacion: UmlRelationEdge }

export function DiagramEditorPage() {
  const { id } = useParams<{ id: string }>()
  const proyectoId = Number(id)
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStop,
    onNodeClick,
    onPaneClick,
    onConnect,
    onCreate,
    onRenameEntity,
    entidades,
    asociaciones,
    onDeleteAsociacion,
    selectedEntidad,
    selectedEntidadId,
    onClearSelection,
    refetch,
    loading,
    error,
    creating,
    createError,
  } = useDiagramCanvas(proyectoId)

  const { theme } = useTheme()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el diagrama</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CanvasToolbar onCreate={onCreate} loading={creating} error={createError} />
      {selectedEntidad && (
        <EntityPropertiesPanel
          proyectoId={proyectoId}
          entidad={selectedEntidad}
          entidades={entidades}
          onRename={onRenameEntity}
          onChanged={refetch}
          onClose={onClearSelection}
        />
      )}
      <ReactFlow
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        // "loose": los 4 puntos de conexión de cada tabla son todos tipo "source" (ver
        // EntityNode) — en modo "strict" (el default) una conexión source-a-source no es
        // válida, hacía falta siempre un handle "target" del otro lado. No hace falta esa
        // distinción acá: la dirección real de la relación la define multiplicidadOrigen/
        // Destino, no de qué handle salió.
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={["Backspace", "Delete"]}
        attributionPosition="bottom-right"
        fitView
      >
        <Background gap={16} color={theme === "dark" ? "oklch(1 0 0 / 12%)" : "oklch(0 0 0 / 10%)"} />
        <Controls
          className="overflow-hidden rounded-xl border border-border bg-card shadow-lg [&_button]:!bg-card [&_button]:!border-border [&_button]:!text-foreground [&_button]:hover:!bg-muted [&_button_svg]:!fill-foreground"
        />
        <MiniMap
          pannable
          zoomable
          bgColor="var(--card)"
          nodeColor="var(--primary)"
          maskColor={theme === "dark" ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.65)"}
          maskStrokeColor="var(--border)"
          className="overflow-hidden rounded-2xl border border-border !bg-card shadow-lg"
        />
        <AssociationClassOverlay asociaciones={asociaciones} onDelete={onDeleteAsociacion} selectedEntidadId={selectedEntidadId} />
        <RelationCrossingOverlay edges={edges} nodes={nodes} />
      </ReactFlow>
    </div>
  )
}
