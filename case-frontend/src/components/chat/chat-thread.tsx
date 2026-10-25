import type { ReactNode } from "react"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

export interface ChatThreadProps {
  /** Cada hijo directo va envuelto en `ChatThreadItem`. */
  children: ReactNode
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  /** Contenido extra bajo "Cargar anteriores" (p. ej. error inline). */
  loadMoreSlot?: ReactNode
  className?: string
}

/** Hilo con auto-scroll al final, posición estable al anteponer y botón "ir al final". */
export function ChatThread({ children, hasMore, loadingMore, onLoadMore, loadMoreSlot, className }: ChatThreadProps) {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller className="min-h-0 flex-1">
        <MessageScrollerViewport preserveScrollOnPrepend aria-label="Mensajes" className="scroll-fade-none scrollbar-hover">
          <MessageScrollerContent className={cn("mx-auto w-full max-w-3xl gap-0 px-3 pt-3 pb-4 sm:px-4", className)}>
            {(hasMore || loadMoreSlot) && (
              <MessageScrollerItem className="flex flex-col items-center gap-1 pb-2">
                {hasMore && (
                  <Button variant="ghost" size="sm" disabled={loadingMore} onClick={onLoadMore}>
                    {loadingMore ? <Spinner data-icon="inline-start" /> : <History data-icon="inline-start" />}
                    Cargar anteriores
                  </Button>
                )}
                {loadMoreSlot}
              </MessageScrollerItem>
            )}
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton aria-label="Ir al último mensaje" />
      </MessageScroller>
    </MessageScrollerProvider>
  )
}

export { MessageScrollerItem as ChatThreadItem }
