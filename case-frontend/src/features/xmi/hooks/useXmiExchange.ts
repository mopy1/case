import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { encodeProjectId } from "@/lib/projectCode"
import { exportXmi, importXmi, previewXmi } from "../api/xmiApi"
import type { ModoImportacionXmi, XmiPreviewResponse } from "../types/xmi.type"
import { mensajeDeError } from "@/lib/api"
import { descargarBlob } from "@/lib/descargarArchivo"

/** Exportar dispara la descarga del archivo directo en el navegador (sin pasos intermedios,
 * `URL.createObjectURL` + un `<a download>` sintético). Importar es en dos pasos — primero
 * `handlePrevisualizar` (solo lectura, no toca la base) para que el ADMIN vea qué trae el archivo
 * y elija modo, recién después `handleImportar` dispara el cambio real. Importar navega a
 * `/diagrama` al terminar — el backend ya creó las entidades/relaciones, esa página hace su propio
 * fetch fresco del lienzo, no hace falta compartir estado entre features para esto. */
export function useXmiExchange(proyectoId: number) {
  const navigate = useNavigate()
  const [exportando, setExportando] = useState(false)
  const [previsualizando, setPrevisualizando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [preview, setPreview] = useState<XmiPreviewResponse | null>(null)
  // Separados (no un solo `error` compartido) — si no, un error de exportación se seguiría
  // mostrando adentro del diálogo de importar la próxima vez que se abre, y viceversa.
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const [errorImportar, setErrorImportar] = useState<string | null>(null)

  async function handleExportar() {
    setExportando(true)
    setErrorExportar(null)
    try {
      const blob = await exportXmi(proyectoId)
      descargarBlob(blob, `proyecto-${proyectoId}.xmi`)
    } catch (err) {
      setErrorExportar(mensajeDeError(err, "No se pudo exportar el XMI"))
    } finally {
      setExportando(false)
    }
  }

  async function handlePrevisualizar(archivo: File) {
    setPrevisualizando(true)
    setErrorImportar(null)
    setPreview(null)
    try {
      const resultado = await previewXmi(proyectoId, archivo)
      setPreview(resultado)
      return true
    } catch (err) {
      setErrorImportar(mensajeDeError(err, "No se pudo leer el XMI"))
      return false
    } finally {
      setPrevisualizando(false)
    }
  }

  async function handleImportar(archivo: File, modo: ModoImportacionXmi) {
    setImportando(true)
    setErrorImportar(null)
    try {
      await importXmi(proyectoId, archivo, modo)
      navigate(`/proyectos/${encodeProjectId(proyectoId)}/diagrama`)
      return true
    } catch (err) {
      setErrorImportar(mensajeDeError(err, "No se pudo importar el XMI"))
      return false
    } finally {
      setImportando(false)
    }
  }

  function limpiarPreview() {
    setPreview(null)
    setErrorImportar(null)
  }

  return {
    handleExportar,
    handlePrevisualizar,
    handleImportar,
    limpiarPreview,
    exportando,
    previsualizando,
    importando,
    preview,
    errorExportar,
    errorImportar,
  }
}
