import { ChatMessage, ChatMessageActions, MessageMarkdown, horaCorta } from "@/components/chat"
import type { ChatAuthor } from "@/components/chat"
import type { GuiaMensaje } from "../../types/copilot.types"
import { GuiaMessageActions } from "./guia-message-actions"

const GUIA: ChatAuthor = { id: "guia", name: "Guía", kind: "agent" }
const YO: ChatAuthor = { id: "yo", name: "Vos", kind: "human" }

/** Adaptador `GuiaMensaje` → `ChatMessage` (sin tarjetas aplicables: la Guía no modifica el proyecto). */
export function GuiaMessageItem({ mensaje }: { mensaje: GuiaMensaje }) {
  const own = mensaje.sender === "user"

  return (
    <ChatMessage
      variant={own ? "own" : "agent"}
      author={own ? YO : GUIA}
      time={horaCorta(mensaje.timestamp)}
      dateTime={mensaje.timestamp}
      tone={mensaje.error ? "error" : "default"}
      sources={mensaje.fuentes}
      actions={own || mensaje.error ? undefined : <ChatMessageActions text={mensaje.text} />}
      extras={own ? undefined : <GuiaMessageActions irA={mensaje.irA} pasos={mensaje.pasos} />}
    >
      {own ? <p className="whitespace-pre-wrap">{mensaje.text}</p> : <MessageMarkdown text={mensaje.text} />}
    </ChatMessage>
  )
}
