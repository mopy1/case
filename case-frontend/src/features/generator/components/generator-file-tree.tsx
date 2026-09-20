import { memo } from "react"
import { FileCode, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArchivoGenerado } from "../types/generator.types"

function getFileIcon(tipo: ArchivoGenerado["tipo"], ruta: string) {
  if (ruta.endsWith(".xml") || ruta.endsWith(".properties")) {
    return <Settings className="size-3.5 text-amber-500" />
  }
  if (tipo === "JAVA") {
    return <FileCode className="size-3.5 text-sky-400" />
  }
  return <FileText className="size-3.5 text-emerald-400" />
}

function getDisplayPath(ruta: string) {
  return ruta.replace("src/main/java/com/casetool/generated/", "")
}

export const GeneratorFileTree = memo(function GeneratorFileTree({
  archivos,
  selectedFile,
  onSelect,
}: {
  archivos: ArchivoGenerado[]
  selectedFile: ArchivoGenerado | null
  onSelect: (file: ArchivoGenerado) => void
}) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto pr-1">
      {archivos.map((archivo) => {
        const isSelected = selectedFile?.ruta === archivo.ruta
        return (
          <button
            key={archivo.ruta}
            type="button"
            onClick={() => onSelect(archivo)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-mono transition-colors",
              isSelected
                ? "bg-primary/15 text-primary font-medium ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {getFileIcon(archivo.tipo, archivo.ruta)}
            <span className="truncate" title={archivo.ruta}>
              {getDisplayPath(archivo.ruta)}
            </span>
          </button>
        )
      })}
    </div>
  )
})
