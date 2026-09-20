import type { AdrSuggestion, CopilotMessage, EntitySuggestion, RelationSuggestion } from "../types/copilot.types"
import { CopilotAdrCard } from "./copilot-adr-card"
import { CopilotEntityCard } from "./copilot-entity-card"
import { CopilotRelationCard } from "./copilot-relation-card"

interface CopilotMessageItemProps {
  message: CopilotMessage
  isSavingAdr: boolean
  creatingEntityKey?: string | null
  creatingRelationKey?: string | null
  onSaveAdr: (messageId: string, adr: AdrSuggestion) => void
  onCreateEntity: (messageId: string, entityIndex: number, entity: EntitySuggestion) => void
  onCreateRelation: (messageId: string, relationIndex: number, relation: RelationSuggestion) => void
}

function renderFormattedContent(text: string) {
  const lines = text.split("\n")
  return (
    <div className="flex flex-col gap-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={idx} className="h-1" />

        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={idx} className="font-semibold text-foreground tracking-tight">
              {trimmed.replace("### ", "")}
            </h4>
          )
        }

        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")
        const content = isBullet ? trimmed.replace(/^[•\-*]\s*/, "") : trimmed

        const formatted = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code key={pIdx} className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-primary">
                {part.slice(1, -1)}
              </code>
            )
          }
          return part
        })

        return (
          <div key={idx} className={isBullet ? "flex items-start gap-1.5 pl-1" : ""}>
            {isBullet && <span className="text-primary font-bold">•</span>}
            <span className="flex-1">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}

export function CopilotMessageItem({
  message,
  isSavingAdr,
  creatingEntityKey,
  creatingRelationKey,
  onSaveAdr,
  onCreateEntity,
  onCreateRelation,
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

      {message.adrSuggestion && !isUser && (
        <CopilotAdrCard
          messageId={message.id}
          adr={message.adrSuggestion}
          isSaving={isSavingAdr}
          onSave={onSaveAdr}
        />
      )}

      {message.entitySuggestions && !isUser && message.entitySuggestions.length > 0 && (
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

      {message.relationSuggestions && !isUser && message.relationSuggestions.length > 0 && (
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

      <span className="px-1 text-[10px] text-muted-foreground">{message.timestamp}</span>
    </div>
  )
}
