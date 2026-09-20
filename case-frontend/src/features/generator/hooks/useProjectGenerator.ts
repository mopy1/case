import { useCallback, useEffect, useState } from "react"
import { generatorApi } from "../api/generatorApi"
import type { ArchivoGenerado, GeneradorPreviewResponse } from "../types/generator.types"

export function useProjectGenerator(proyectoId: number) {
  const [preview, setPreview] = useState<GeneradorPreviewResponse | null>(null)
  const [selectedFile, setSelectedFile] = useState<ArchivoGenerado | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarPreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await generatorApi.obtenerPreview(proyectoId)
      setPreview(data)
      if (data.archivos.length > 0) {
        // Seleccionar por defecto pom.xml o el primer controller
        const defaultFile = data.archivos.find((a) => a.ruta === "pom.xml") ?? data.archivos[0]
        setSelectedFile(defaultFile)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al cargar vista previa")
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    cargarPreview()
  }, [cargarPreview])

  const descargar = useCallback(async () => {
    try {
      setDownloading(true)
      await generatorApi.descargarZip(proyectoId, preview?.nombreProyecto)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar el archivo ZIP")
    } finally {
      setDownloading(false)
    }
  }, [proyectoId, preview?.nombreProyecto])

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
