import { useState } from "react"
import { useNavigate } from "react-router-dom"
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
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement("a")
      enlace.href = url
      enlace.download = `diagrama-${proyectoId}.xmi`
      enlace.click()
      URL.revokeObjectURL(url)
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
      navigate(`/proyectos/${proyectoId}/diagrama`)
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
