import type {
  AdrSuggestion,
  AttributeSuggestion,
  CopilotMessage,
  EntityDeleteSuggestion,
  EntitySuggestion,
  RelationSuggestion,
} from "../types/copilot.types"
import { CopilotAdrCard } from "./copilot-adr-card"
import { CopilotApplyAllButton } from "./copilot-apply-all-button"
import { CopilotAttributeCard } from "./copilot-attribute-card"
import { CopilotEntityCard } from "./copilot-entity-card"
import { CopilotEntityDeleteCard } from "./copilot-entity-delete-card"
import { CopilotRelationCard } from "./copilot-relation-card"
import { renderFormattedContent } from "./copilot-text-formatter"

export interface CopilotMessageItemProps {
  message: CopilotMessage
  isSavingAdr: boolean
  creatingEntityKey?: string | null
  creatingRelationKey?: string | null
  creatingAttributeKey?: string | null
  deletingEntityKey?: string | null
  isApplyingAll?: boolean
  onSaveAdr: (messageId: string, adr: AdrSuggestion) => void
  onCreateEntity: (messageId: string, entityIndex: number, entity: EntitySuggestion) => void
  onCreateRelation: (messageId: string, relationIndex: number, relation: RelationSuggestion) => void
  onCreateAttribute: (messageId: string, attributeIndex: number, attribute: AttributeSuggestion) => void
  onDeleteEntity: (messageId: string, deleteIndex: number, suggestion: EntityDeleteSuggestion) => void
  onApplyAll: (message: CopilotMessage) => void
}

export function CopilotMessageItem({
  message,
  isSavingAdr,
  creatingEntityKey,
  creatingRelationKey,
  creatingAttributeKey,
  deletingEntityKey,
  isApplyingAll,
  onSaveAdr,
  onCreateEntity,
  onCreateRelation,
  onCreateAttribute,
  onDeleteEntity,
  onApplyAll,
}: CopilotMessageItemProps) {
  const isUser = message.sender === "user"

  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`rounded-2xl px-3.5 py-2.5 text-xs ${
          isUser
            ? "max-w-[85%] rounded-tr-xs bg-primary text-primary-foreground shadow-xs"
            : "max-w-[95%] rounded-tl-xs border border-border/70 bg-card text-card-foreground shadow-xs"
        }`}
      >
        {isUser ? <p className="whitespace-pre-wrap">{message.text}</p> : renderFormattedContent(message.text)}
      </div>

      {!isUser && (
        <CopilotApplyAllButton message={message} isApplyingAll={!!isApplyingAll} onApplyAll={onApplyAll} />
      )}

      {message.entityDeleteSuggestions && !isUser && (
        <div className="flex w-full flex-col gap-1.5">
          {message.entityDeleteSuggestions.map((del, i) => (
            <CopilotEntityDeleteCard
              key={i}
              messageId={message.id}
              deleteIndex={i}
              suggestion={del}
              isDeleting={deletingEntityKey === `${message.id}-del-${i}`}
              onDelete={onDeleteEntity}
            />
          ))}
        </div>
      )}

      {message.entitySuggestions && !isUser && (
        <div className="flex w-full flex-col gap-1.5">
          {message.entitySuggestions.map((ent, i) => (
            <CopilotEntityCard
              key={i}
              messageId={message.id}
              entityIndex={i}
              entity={ent}
              isCreating={creatingEntityKey === `${message.id}-ent-${i}`}
              onCreate={onCreateEntity}
            />
          ))}
        </div>
      )}

      {message.attributeSuggestions && !isUser && (
        <div className="flex w-full flex-col gap-1.5">
          {message.attributeSuggestions.map((attr, i) => (
            <CopilotAttributeCard
              key={i}
              messageId={message.id}
              attributeIndex={i}
              attribute={attr}
              isCreating={creatingAttributeKey === `${message.id}-attr-${i}`}
              onCreate={onCreateAttribute}
            />
          ))}
        </div>
      )}

      {message.relationSuggestions && !isUser && (
        <div className="flex w-full flex-col gap-1.5">
          {message.relationSuggestions.map((rel, i) => (
            <CopilotRelationCard
              key={i}
              messageId={message.id}
              relationIndex={i}
              relation={rel}
              isCreating={creatingRelationKey === `${message.id}-rel-${i}`}
              onCreate={onCreateRelation}
            />
          ))}
        </div>
      )}

      {message.adrSuggestions && !isUser ? (
        <div className="flex w-full flex-col gap-1.5">
          {message.adrSuggestions.map((adr, i) => (
            <CopilotAdrCard key={i} messageId={message.id} adr={adr} isSaving={isSavingAdr} onSave={onSaveAdr} />
          ))}
        </div>
      ) : message.adrSuggestion && !isUser ? (
        <CopilotAdrCard messageId={message.id} adr={message.adrSuggestion} isSaving={isSavingAdr} onSave={onSaveAdr} />
      ) : null}

      <span className="px-1 text-[10px] text-muted-foreground">{message.timestamp}</span>
    </div>
  )
}
