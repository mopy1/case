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
import { CopilotAdrCard } from "./copilot-adr-card"
import { CopilotAttributeCard } from "./copilot-attribute-card"
import { CopilotEntityCard } from "./copilot-entity-card"
import { CopilotEntityDeleteCard } from "./copilot-entity-delete-card"
import { CopilotRelationCard } from "./copilot-relation-card"
import { CopilotRelationDeleteCard } from "./copilot-relation-delete-card"
import { CopilotSystemActionCard } from "./copilot-system-action-card"
import { CopilotTaskCard } from "./copilot-task-card"

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

export function CopilotCardList({
  message,
  isSavingAdr,
  creatingEntityKey,
  creatingRelationKey,
  creatingAttributeKey,
  deletingEntityKey,
  deletingRelationKey,
  creatingTaskKey,
  executingSystemActionKey,
  onSaveAdr,
  onCreateEntity,
  onCreateRelation,
  onDeleteRelation,
  onCreateAttribute,
  onDeleteEntity,
  onCreateTask,
  onExecuteSystemAction,
}: CopilotCardListProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {message.relationDeleteSuggestions?.map((r, i) => (
        <CopilotRelationDeleteCard
          key={i}
          messageId={message.id}
          deleteIndex={i}
          suggestion={r}
          isDeleting={deletingRelationKey === `${message.id}-reldel-${i}`}
          onDelete={onDeleteRelation}
        />
      ))}

      {message.entityDeleteSuggestions?.map((del, i) => (
        <CopilotEntityDeleteCard
          key={i}
          messageId={message.id}
          deleteIndex={i}
          suggestion={del}
          isDeleting={deletingEntityKey === `${message.id}-del-${i}`}
          onDelete={onDeleteEntity}
        />
      ))}

      {message.entitySuggestions?.map((ent, i) => (
        <CopilotEntityCard
          key={i}
          messageId={message.id}
          entityIndex={i}
          entity={ent}
          isCreating={creatingEntityKey === `${message.id}-ent-${i}`}
          onCreate={onCreateEntity}
        />
      ))}

      {message.attributeSuggestions?.map((attr, i) => (
        <CopilotAttributeCard
          key={i}
          messageId={message.id}
          attributeIndex={i}
          attribute={attr}
          isCreating={creatingAttributeKey === `${message.id}-attr-${i}`}
          onCreate={onCreateAttribute}
        />
      ))}

      {message.relationSuggestions?.map((rel, i) => (
        <CopilotRelationCard
          key={i}
          messageId={message.id}
          relationIndex={i}
          relation={rel}
          isCreating={creatingRelationKey === `${message.id}-rel-${i}`}
          onCreate={onCreateRelation}
        />
      ))}

      {message.taskSuggestions?.map((task, i) => (
        <CopilotTaskCard
          key={i}
          messageId={message.id}
          taskIndex={i}
          task={task}
          isCreating={creatingTaskKey === `${message.id}-task-${i}`}
          onCreate={onCreateTask}
        />
      ))}

      {message.systemActions?.map((act, i) => (
        <CopilotSystemActionCard
          key={i}
          messageId={message.id}
          actionIndex={i}
          action={act}
          isExecuting={executingSystemActionKey === `${message.id}-sys-${i}`}
          onExecute={onExecuteSystemAction}
        />
      ))}

      {message.adrSuggestions ? (
        message.adrSuggestions.map((adr, i) => (
          <CopilotAdrCard key={i} messageId={message.id} adr={adr} isSaving={isSavingAdr} onSave={onSaveAdr} />
        ))
      ) : message.adrSuggestion ? (
        <CopilotAdrCard messageId={message.id} adr={message.adrSuggestion} isSaving={isSavingAdr} onSave={onSaveAdr} />
      ) : null}
    </div>
  )
}
