import { useCallback, useEffect, useState } from "react"
import { getDiagram } from "@/features/diagram/api/diagramApi"
import { getProject } from "@/features/projects/api/projectsApi"
import { generarProyectoSpringBoot } from "../lib/springBootGenerator"
import { notificarExportacion } from "@/features/guia"
import { descargarProyectoZip } from "../lib/zipExporter"
import type { ArchivoGenerado, GeneradorPreviewResponse } from "../types/generator.types"

export function useProjectGenerator(proyectoId: number) {
  const [preview, setPreview] = useState<GeneradorPreviewResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<ArchivoGenerado | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarPreview = useCallback(async () => {
    if (!proyectoId) return
    try {
      setLoading(true)
      setError(null)

      // Carga paralela de diagrama y metadatos del proyecto
      const [diagrama, proyecto] = await Promise.all([
        getDiagram(proyectoId),
        getProject(proyectoId).catch(() => ({ nombre: `proyecto-${proyectoId}` })),
      ])

      const data = generarProyectoSpringBoot(proyecto.nombre, diagrama)
      setPreview(data)

      if (data.archivos.length > 0) {
        // Seleccionar por defecto pom.xml o el primer archivo del árbol
        const defaultFile = data.archivos.find((a) => a.ruta === "pom.xml") ?? data.archivos[0]
        setSelectedFile(defaultFile)
      } else {
        setSelectedFile(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al generar el backend")
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    cargarPreview()
  }, [cargarPreview])

  const descargar = useCallback(async () => {
    if (!preview || preview.archivos.length === 0) return
    try {
      setDownloading(true)
      await descargarProyectoZip(preview.archivos, proyectoId)
      notificarExportacion(proyectoId, "backend")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar o descargar el archivo ZIP")
    } finally {
      setDownloading(false)
    }
  }, [proyectoId, preview])

  return {
    preview,
    selectedFile,
    setSelectedFile,
    loading,
    downloading,
    error,
    recargar: cargarPreview,
    descargar,
  }
}
