import type { MentionItem } from "../types/mention.types"
import { ChatMentionItem } from "./chat-mention-item"

interface ChatMentionPopoverProps {
  candidatos: MentionItem[]
  indiceSeleccionado: number
  onSeleccionar: (item: MentionItem) => void
  onHoverItem: (index: number) => void
}

/** Lista flotante sobre el composer para autocompletar menciones con @ (flechas, Enter, Tab, Esc). */
export function ChatMentionPopover({ candidatos, indiceSeleccionado, onSeleccionar, onHoverItem }: ChatMentionPopoverProps) {
  return (
    <div
      role="listbox"
      aria-label="Sugerencias de mención"
      className="absolute inset-x-0 bottom-full z-30 mb-1 flex max-h-56 flex-col gap-0.5 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      {candidatos.length === 0 ? (
        <p className="px-3 py-2.5 text-center text-sm text-muted-foreground">Sin coincidencias</p>
      ) : (
        candidatos.map((item, index) => (
          <ChatMentionItem
            key={item.id}
            item={item}
            seleccionado={index === indiceSeleccionado}
            onSelect={() => onSeleccionar(item)}
            onHover={() => onHoverItem(index)}
          />
        ))
      )}
    </div>
  )
}
