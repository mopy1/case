import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message"
import { cn } from "@/lib/utils"
import { ChatAvatar } from "./chat-avatar"
import { ChatMessageMeta } from "./chat-message-meta"
import type { ChatAuthor, ChatMessageVariant } from "./chat.types"

export interface ChatMessageProps {
  variant: ChatMessageVariant
  author: ChatAuthor
  time: string
  dateTime?: string
  /** Mensaje consecutivo del mismo autor: oculta avatar y cabecera. */
  grouped?: boolean
  mentionedMe?: boolean
  tone?: "default" | "error"
  quote?: ReactNode
  attachment?: ReactNode
  children: ReactNode
  /** Barra "Aplicar todos" + tarjetas (solo IA). */
  extras?: ReactNode
  /** Copiar / Guardar ADR (aparecen al pasar el mouse). */
  actions?: ReactNode
  /** F3: fuentes que consultó la IA ("Diagrama", "Historial"); siempre visibles. */
  sources?: string[]
}

const BURBUJA_HUMANA = "max-w-[min(85%,56ch)]"

/** Un solo sistema de mensaje: humano = burbuja, IA = documento, sistema = marcador centrado. */
export function ChatMessage(props: ChatMessageProps) {
  const { variant, author, time, dateTime, grouped, mentionedMe, tone, quote, attachment, children, extras, actions, sources } = props

  if (variant === "system") {
    return (
      <Marker variant="separator" className="text-xs" role="note">
        <MarkerIcon>
          <Info />
        </MarkerIcon>
        <MarkerContent className="max-w-[80%]">{children}</MarkerContent>
      </Marker>
    )
  }

  const own = variant === "own"
  const agent = variant === "agent"
  const bubbleVariant = own ? "tinted" : agent ? "ghost" : mentionedMe ? "outline" : "muted"

  return (
    <Message align={own ? "end" : "start"} className={grouped ? "mt-1" : "mt-5"}>
      {!own && (
        <MessageAvatar className="min-w-7 self-start bg-transparent group-has-data-[slot=message-footer]/message:translate-y-0">
          <ChatAvatar author={author} className={cn(grouped && "invisible")} />
        </MessageAvatar>
      )}
      <MessageContent className="gap-1.5">
        {!own && !grouped && (
          <MessageHeader className="px-0">
            <ChatMessageMeta author={author} time={time} dateTime={dateTime} mentionedMe={mentionedMe} />
          </MessageHeader>
        )}
        {quote}
        <Bubble
          variant={bubbleVariant}
          align={own ? "end" : "start"}
          className={cn(
            agent ? "w-full" : BURBUJA_HUMANA,
            mentionedMe && !agent && "*:data-[slot=bubble-content]:border-mention/50"
          )}
        >
          <BubbleContent className={cn("rounded-2xl", agent && "max-w-(--chat-measure)", tone === "error" && "text-destructive")}>
            {attachment}
            {children}
          </BubbleContent>
        </Bubble>
        {sources && sources.length > 0 && <p className="text-xs text-muted-foreground">Consultó: {sources.join(" · ")}</p>}
        {actions && (
          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 pointer-coarse:opacity-100">
            {actions}
          </div>
        )}
        {extras && <div className="flex w-full max-w-(--chat-measure) flex-col gap-2">{extras}</div>}
        {own && !grouped && (
          <MessageFooter className="px-0 font-normal tabular-nums">
            <time dateTime={dateTime}>{time}</time>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  )
}
