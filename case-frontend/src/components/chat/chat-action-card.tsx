import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { CheckCheck, Lock, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { ActionStatus } from "./chat.types"

export interface ChatActionCardProps {
  icon: LucideIcon
  title: string
  /** Badge a la derecha del título ("8 cambios", "Media"). */
  meta?: ReactNode
  children?: ReactNode
  status: ActionStatus
  actionLabel: string
  runningLabel?: string
  doneLabel?: string
  lockedReason?: string
  errorText?: string
  onAction?: () => void
  /** primary = única acción principal del mensaje; secondary = outline. */
  emphasis?: "primary" | "secondary"
  tone?: "default" | "destructive"
  /** Acciones secundarias del pie (p. ej. "Ver DDL", "Guardar ADR"). */
  secondary?: ReactNode
  size?: "default" | "sm"
}

/** Tarjeta aplicable con 5 estados: idle, running, done, locked y error. */
export function ChatActionCard(props: ChatActionCardProps) {
  const { icon: Icon, title, meta, children, status, actionLabel, runningLabel, doneLabel, lockedReason, errorText } = props
  const { onAction, emphasis = "secondary", tone = "default", secondary, size = "sm" } = props
  const variant = tone === "destructive" ? "destructive" : emphasis === "primary" ? "default" : "outline"

  return (
    // mb-px: el ítem del scroller usa content-visibility (contención de pintura) y recortaba el ring inferior.
    <Card size={size} className="mb-px gap-3 rounded-2xl shadow-none ring-border dark:ring-border">
      <CardHeader>
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
          <Icon className={cn("size-4 shrink-0", tone === "destructive" ? "text-destructive" : "text-muted-foreground")} />
          <span className="min-w-0 wrap-break-word">{title}</span>
        </CardTitle>
        {meta && <CardAction>{meta}</CardAction>}
      </CardHeader>
      {children && <CardContent className="flex min-w-0 flex-col gap-2 text-sm">{children}</CardContent>}
      <CardFooter className="flex-wrap gap-2">
        {status === "done" ? (
          <p className="flex items-center gap-1.5 text-sm text-success">
            <CheckCheck className="size-4" /> {doneLabel ?? "Listo"}
          </p>
        ) : (
          <>
            <Button size="sm" variant={variant} disabled={status === "running" || status === "locked"} onClick={onAction}>
              {status === "running" ? <Spinner data-icon="inline-start" /> : status === "error" ? <RotateCcw data-icon="inline-start" /> : null}
              {status === "running" ? (runningLabel ?? actionLabel) : status === "error" ? "Reintentar" : actionLabel}
            </Button>
            {secondary}
            {status === "locked" && lockedReason && (
              <p className="flex basis-full items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 shrink-0" /> {lockedReason}
              </p>
            )}
            {status === "error" && errorText && <p className="basis-full text-xs text-destructive">{errorText}</p>}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
