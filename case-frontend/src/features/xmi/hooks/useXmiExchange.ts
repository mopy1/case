import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { encodeProjectId } from "@/lib/projectCode"
import { exportXmi, importXmi } from "../api/xmiApi"

/** Exportar dispara la descarga del archivo directo en el navegador (sin pasos intermedios,
 * `URL.createObjectURL` + un `<a download>` sintético). Importar navega a `/diagrama` al
 * terminar — el backend ya creó las entidades/relaciones, esa página hace su propio fetch fresco
 * del lienzo, no hace falta compartir estado entre features para esto. */
export function useXmiExchange(proyectoId: number) {
  const navigate = useNavigate()
  const [exportando, setExportando] = useState(false)
  const [importando, setImportando] = useState(false)
  // Separados (no un solo `error` compartido) — si no, un error de exportación se seguiría
  // mostrando adentro del diálogo de importar la próxima vez que se abre, y viceversa.
  const [errorExportar, setErrorExportar] = useState<string | null>(null)
  const [errorImportar, setErrorImportar] = useState<string | null>(null)

  async function handleExportar() {
    setExportando(true)
    setErrorExportar(null)
    try {
      const blob = await exportXmi(proyectoId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `proyecto-${proyectoId}.xmi`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setErrorExportar(err.message || "No se pudo exportar el XMI")
    } finally {
      setExportando(false)
    }
  }

  async function handleImportar(archivo: File) {
    setImportando(true)
    setErrorImportar(null)
    try {
      await importXmi(proyectoId, archivo)
      navigate(`/proyectos/${encodeProjectId(proyectoId)}/diagrama`)
      return true
    } catch (err: any) {
      setErrorImportar(err.message || "No se pudo importar el XMI")
      return false
    } finally {
      setImportando(false)
    }
  }

  return { handleExportar, handleImportar, exportando, importando, errorExportar, errorImportar }
}
