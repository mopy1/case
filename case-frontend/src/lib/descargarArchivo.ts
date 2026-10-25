/** Dispara la descarga de un `Blob` en el navegador con un `<a download>` sintético (el mismo
 * mecanismo para el XMI exportado desde `features/xmi` y desde una acción del Copilot). */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
