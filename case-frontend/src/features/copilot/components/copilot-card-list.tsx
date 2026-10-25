import { useState } from "react"
import { Button } from "@/components/ui/button"
import type {
  AdrSuggestion,
  AttributeSuggestion,
  CopilotMessage,
  EntityDeleteSuggestion,
  EntitySuggestion,
  RelationDeleteSuggestion,
  RelationSuggestion,
  SystemActionSuggestion,
  TaskSuggestion,
} from "../types/copilot.types"
import { countPendingActions } from "../lib/copilotPendingActions"
import { CopilotAdrCard } from "./copilot-adr-card"
import { CopilotAttributeCard } from "./copilot-attribute-card"
import { CopilotEntityCard } from "./copilot-entity-card"
import { CopilotEntityDeleteCard } from "./copilot-entity-delete-card"
import { CopilotRelationCard } from "./copilot-relation-card"
import { CopilotRelationDeleteCard } from "./copilot-relation-delete-card"
import { CopilotSystemActionCard } from "./copilot-system-action-card"
import { CopilotTaskCard } from "./copilot-task-card"

const VISIBLES = 3

export interface CopilotCardListProps {
  message: CopilotMessage
  isSavingAdr: boolean
  creatingEntityKey?: string | null
  creatingRelationKey?: string | null
  creatingAttributeKey?: string | null
  deletingEntityKey?: string | null
  deletingRelationKey?: string | null
  creatingTaskKey?: string | null
  executingSystemActionKey?: string | null
  onSaveAdr: (messageId: string, adr: AdrSuggestion) => void
  onCreateEntity: (messageId: string, entityIndex: number, entity: EntitySuggestion) => void
  onCreateRelation: (messageId: string, relationIndex: number, relation: RelationSuggestion) => void
  onDeleteRelation: (messageId: string, relationIndex: number, suggestion: RelationDeleteSuggestion) => void
  onCreateAttribute: (messageId: string, attributeIndex: number, attribute: AttributeSuggestion) => void
  onDeleteEntity: (messageId: string, deleteIndex: number, suggestion: EntityDeleteSuggestion) => void
  onCreateTask: (messageId: string, taskIndex: number, task: TaskSuggestion) => void
  onExecuteSystemAction: (messageId: string, actionIndex: number, action: SystemActionSuggestion) => void
}

/** Tarjetas de un mensaje: las primeras 3 y "Ver N sugerencias más". */
export function CopilotCardList({ message: m, isSavingAdr, ...p }: CopilotCardListProps) {
  const [todas, setTodas] = useState(false)
  const id = m.id
  const emphasis = countPendingActions(m) === 1 ? "primary" : "secondary"
  const base = { messageId: id, emphasis } as const
  const adrs = m.adrSuggestions ?? (m.adrSuggestion ? [m.adrSuggestion] : [])

  const tarjetas = [
    ...(m.relationDeleteSuggestions ?? []).map((s, i) => (
      <CopilotRelationDeleteCard key={`rd${i}`} {...base} deleteIndex={i} suggestion={s} isDeleting={p.deletingRelationKey === `${id}-reldel-${i}`} onDelete={p.onDeleteRelation} />
    )),
    ...(m.entityDeleteSuggestions ?? []).map((s, i) => (
      <CopilotEntityDeleteCard key={`ed${i}`} {...base} deleteIndex={i} suggestion={s} isDeleting={p.deletingEntityKey === `${id}-del-${i}`} onDelete={p.onDeleteEntity} />
    )),
    ...(m.entitySuggestions ?? []).map((e, i) => (
      <CopilotEntityCard key={`e${i}`} {...base} entityIndex={i} entity={e} isCreating={p.creatingEntityKey === `${id}-ent-${i}`} onCreate={p.onCreateEntity} />
    )),
    ...(m.attributeSuggestions ?? []).map((a, i) => (
      <CopilotAttributeCard key={`a${i}`} {...base} attributeIndex={i} attribute={a} isCreating={p.creatingAttributeKey === `${id}-attr-${i}`} onCreate={p.onCreateAttribute} />
    )),
    ...(m.relationSuggestions ?? []).map((r, i) => (
      <CopilotRelationCard key={`r${i}`} {...base} relationIndex={i} relation={r} isCreating={p.creatingRelationKey === `${id}-rel-${i}`} onCreate={p.onCreateRelation} />
    )),
    ...(m.taskSuggestions ?? []).map((t, i) => (
      <CopilotTaskCard key={`t${i}`} {...base} taskIndex={i} task={t} isCreating={p.creatingTaskKey === `${id}-task-${i}`} onCreate={p.onCreateTask} />
    )),
    ...(m.systemActions ?? []).map((s, i) => (
      <CopilotSystemActionCard key={`s${i}`} {...base} actionIndex={i} action={s} isExecuting={p.executingSystemActionKey === `${id}-sys-${i}`} onExecute={p.onExecuteSystemAction} />
    )),
    ...adrs.map((adr, i) => <CopilotAdrCard key={`adr${i}`} {...base} adr={adr} isSaving={isSavingAdr} onSave={p.onSaveAdr} />),
  ]
  if (tarjetas.length === 0) return null
  const ocultas = tarjetas.length - VISIBLES

  return (
    <>
      {todas ? tarjetas : tarjetas.slice(0, VISIBLES)}
      {ocultas > 0 && (
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setTodas((v) => !v)}>
          {todas ? "Ver menos" : ocultas === 1 ? "Ver 1 sugerencia más" : `Ver ${ocultas} sugerencias más`}
        </Button>
      )}
    </>
  )
}
