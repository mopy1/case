import JSZip from "jszip"
import { saveAs } from "file-saver"
import type { ArchivoGenerado } from "../types/generator.types"

/**
 * Empaqueta la lista de archivos generados en un archivo .ZIP y dispara la
 * descarga en el navegador con el nombre canónico `backend-${proyectoId}.zip`.
 */
export async function descargarProyectoZip(
  archivos: ArchivoGenerado[],
  proyectoId: number | string
): Promise<void> {
  const zip = new JSZip()

  for (const archivo of archivos) {
    const isExecutable = archivo.ruta === "mvnw"
    zip.file(archivo.ruta, archivo.contenido, {
      unixPermissions: isExecutable ? "755" : undefined,
    })
  }

  const blob = await zip.generateAsync({
    type: "blob",
    platform: "UNIX",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  saveAs(blob, `backend-${proyectoId}.zip`)
}
