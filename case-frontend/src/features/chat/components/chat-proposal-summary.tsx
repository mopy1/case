import { Database, FolderPlus, GitBranch, ListTodo, FileText, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ChatProposalSummary as SummaryData } from "../types/chat-proposal.types"

interface ChatProposalSummaryProps {
  summary: SummaryData
  detalles: string[]
}

export function ChatProposalSummary({ summary, detalles }: ChatProposalSummaryProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {summary.tablasNuevas > 0 && (
          <Badge variant="secondary" className="gap-1 border-primary/20 text-[10px]">
            <Database className="size-2.5 text-primary" />
            {summary.tablasNuevas} {summary.tablasNuevas === 1 ? "tabla nueva" : "tablas nuevas"}
          </Badge>
        )}
        {summary.atributosNuevos > 0 && (
          <Badge variant="secondary" className="gap-1 border-sky-500/20 text-[10px]">
            <FolderPlus className="size-2.5 text-sky-500" />
            {summary.atributosNuevos} {summary.atributosNuevos === 1 ? "atributo" : "atributos"}
          </Badge>
        )}
        {summary.relacionesNuevas > 0 && (
          <Badge variant="secondary" className="gap-1 border-indigo-500/20 text-[10px]">
            <GitBranch className="size-2.5 text-indigo-500" />
            {summary.relacionesNuevas} {summary.relacionesNuevas === 1 ? "relación" : "relaciones"}
          </Badge>
        )}
        {summary.tareasNuevas > 0 && (
          <Badge variant="secondary" className="gap-1 border-amber-500/20 text-[10px]">
            <ListTodo className="size-2.5 text-amber-500" />
            {summary.tareasNuevas} {summary.tareasNuevas === 1 ? "tarea" : "tareas"}
          </Badge>
        )}
        {summary.adrsNuevas > 0 && (
          <Badge variant="secondary" className="gap-1 border-emerald-500/20 text-[10px]">
            <FileText className="size-2.5 text-emerald-500" />
            {summary.adrsNuevas} {summary.adrsNuevas === 1 ? "nota ADR" : "notas ADR"}
          </Badge>
        )}
        {summary.tablasEliminadas > 0 && (
          <Badge variant="destructive" className="gap-1 text-[10px]">
            <Trash2 className="size-2.5" />
            {summary.tablasEliminadas} {summary.tablasEliminadas === 1 ? "tabla eliminada" : "tablas eliminadas"}
          </Badge>
        )}
      </div>

      <ul className="max-h-24 space-y-0.5 overflow-y-auto rounded-md bg-muted/40 p-1.5 text-[10px] text-muted-foreground">
        {detalles.map((d, idx) => (
          <li key={idx} className="flex items-center gap-1.5 truncate">
            <span className="size-1 shrink-0 rounded-full bg-primary/60" />
            <span className="truncate">{d}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
