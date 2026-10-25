import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import type { ChatActionButton } from "./chat.types"

export interface ChatEmptyProps {
  icon: LucideIcon
  title: string
  description: string
  primaryAction: ChatActionButton
  secondaryAction?: ChatActionButton
  /** Normalmente `ChatQuickActions layout="stack"`. */
  children?: ReactNode
}

/** Estado vacío accionable: una acción primaria, una secundaria opcional y sugerencias. */
export function ChatEmpty({ icon: Icon, title, description, primaryAction, secondaryAction, children }: ChatEmptyProps) {
  return (
    <Empty className="min-h-0 overflow-y-auto border-0 p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button size="sm" disabled={primaryAction.loading} onClick={primaryAction.onClick}>
            {primaryAction.loading && <Spinner data-icon="inline-start" />}
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button size="sm" variant="outline" disabled={secondaryAction.loading} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
        {children}
      </EmptyContent>
    </Empty>
  )
}
