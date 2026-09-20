import { memo, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ArchivoGenerado } from "../types/generator.types"

export const GeneratorCodeViewer = memo(function GeneratorCodeViewer({
  file,
}: {
  file: ArchivoGenerado | null
}) {
  const [copied, setCopied] = useState(false)

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-xs text-muted-foreground">
        Selecciona un archivo del árbol para ver su contenido
      </div>
    )
  }

  const lines = file.contenido.split("\n")

  async function handleCopy() {
    if (!file) return
    await navigator.clipboard.writeText(file.contenido)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{file.ruta}</span>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleCopy}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground">
        <pre className="flex">
          <span className="mr-4 select-none text-right text-muted-foreground/40" style={{ minWidth: "2.5rem" }}>
            {lines.map((_, i) => (
              <span key={i} className="block">
                {i + 1}
              </span>
            ))}
          </span>
          <code className="flex-1 whitespace-pre">{file.contenido}</code>
        </pre>
      </div>
    </div>
  )
})
