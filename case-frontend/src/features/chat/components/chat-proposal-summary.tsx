import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Database, FileText, FolderPlus, GitBranch, ListTodo, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ChatProposalSummary as SummaryData } from "../types/chat-proposal.types"

const VISIBLES = 4

interface ChatProposalSummaryProps {
  summary: SummaryData
  detalles: string[]
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Chips de resumen + primeros 4 detalles con "Ver N más" (sin scroll interno). */
export function ChatProposalSummary({ summary: s, detalles }: ChatProposalSummaryProps) {
  const [abierto, setAbierto] = useState(false)
  const chips: [number, LucideIcon, string][] = [
    [s.tablasNuevas, Database, plural(s.tablasNuevas, "tabla nueva", "tablas nuevas")],
    [s.atributosNuevos, FolderPlus, plural(s.atributosNuevos, "atributo", "atributos")],
    [s.relacionesNuevas, GitBranch, plural(s.relacionesNuevas, "relación", "relaciones")],
    [s.tareasNuevas, ListTodo, plural(s.tareasNuevas, "tarea", "tareas")],
    [s.adrsNuevas, FileText, plural(s.adrsNuevas, "nota ADR", "notas ADR")],
    [s.tablasEliminadas, Trash2, plural(s.tablasEliminadas, "tabla eliminada", "tablas eliminadas")],
  ]
  const lista = abierto ? detalles : detalles.slice(0, VISIBLES)

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {chips
          .filter(([n]) => n > 0)
          .map(([, Icon, texto]) => (
            <Badge key={texto} variant="outline">
              <Icon className="text-muted-foreground" /> {texto}
            </Badge>
          ))}
      </div>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {lista.map((d, i) => (
          <li key={i} className="flex min-w-0 items-start gap-2">
            <span aria-hidden="true">•</span>
            <span className="min-w-0 wrap-break-word">{d}</span>
          </li>
        ))}
      </ul>
      {detalles.length > VISIBLES && (
        <Button variant="ghost" size="xs" className="w-fit" onClick={() => setAbierto((v) => !v)}>
          {abierto ? "Ver menos" : `Ver ${detalles.length - VISIBLES} más`}
        </Button>
      )}
    </>
  )
}
