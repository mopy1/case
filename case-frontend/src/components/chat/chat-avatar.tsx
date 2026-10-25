import { Bot, Info } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { colorAvatar, iniciales } from "@/lib/avatar"
import { cn } from "@/lib/utils"
import type { ChatAuthor } from "./chat.types"

export interface ChatAvatarProps {
  author: ChatAuthor
  /** sm = 24 px, default = 28 px. */
  size?: "sm" | "default"
  className?: string
}

/** Avatar del autor: iniciales con color de identidad (humano), Bot (IA) o Info (sistema). */
export function ChatAvatar({ author, size = "default", className }: ChatAvatarProps) {
  const color =
    author.kind === "agent" ? "bg-primary/10 text-primary" : author.kind === "system" ? "" : colorAvatar(author.id)

  return (
    <Avatar size="sm" className={cn(size === "default" && "size-7", className)} aria-hidden="true">
      <AvatarFallback className={cn("text-xs font-medium", color)}>
        {author.kind === "agent" ? <Bot className="size-4" /> : author.kind === "system" ? <Info className="size-4" /> : iniciales(author.name)}
      </AvatarFallback>
    </Avatar>
  )
}
