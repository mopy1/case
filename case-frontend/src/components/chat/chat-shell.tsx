import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface ChatShellProps {
  header: ReactNode
  /** ChatThread | ChatEmpty | ChatError | ChatSkeleton. */
  children: ReactNode
  composer?: ReactNode
  className?: string
}

/** Columna del chat: cabecera, cuerpo y composer; define el contenedor `@container/chat`. */
export function ChatShell({ header, children, composer, className }: ChatShellProps) {
  return (
    <div className={cn("@container/chat flex min-h-0 flex-1 flex-col", className)}>
      {header}
      {children}
      {composer}
    </div>
  )
}
