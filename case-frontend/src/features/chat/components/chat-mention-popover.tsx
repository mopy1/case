import type { MentionItem } from "../types/mention.types"
import { ChatMentionItem } from "./chat-mention-item"

interface ChatMentionPopoverProps {
  candidatos: MentionItem[]
  indiceSeleccionado: number
  onSeleccionar: (item: MentionItem) => void
  onHoverItem: (index: number) => void
}

/**
 * Popover flotante accesible posicionado sobre el input para autocompletar menciones con @.
 */
export function ChatMentionPopover({
  candidatos,
  indiceSeleccionado,
  onSeleccionar,
  onHoverItem,
}: ChatMentionPopoverProps) {
  return (
    <div
      role="listbox"
      aria-label="Sugerencias de mención"
      className="absolute bottom-full left-0 right-0 z-30 mb-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1.5 shadow-lg backdrop-blur-xs animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {candidatos.length === 0 ? (
        <div className="px-3 py-2.5 text-center text-xs text-muted-foreground select-none">
          Sin coincidencias para la mención
        </div>
      ) : (
        <div className="space-y-0.5">
          {candidatos.map((item, index) => (
            <ChatMentionItem
              key={item.id}
              item={item}
              seleccionado={index === indiceSeleccionado}
              onSelect={() => onSeleccionar(item)}
              onHover={() => onHoverItem(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
