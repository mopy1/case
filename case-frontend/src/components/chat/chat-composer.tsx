import type { KeyboardEvent, KeyboardEventHandler, ReactNode, RefObject } from "react"
import { useRef } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useAutosize } from "./use-autosize"

export interface ChatComposerProps {
  value: string
  onValueChange: (value: string, caret: number) => void
  onSubmit: () => void
  placeholder: string
  ariaLabel: string
  disabled?: boolean
  busy?: boolean
  /** Por defecto: hay texto. */
  canSubmit?: boolean
  maxLength?: number
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  /** Se llama antes del Enter propio; devolver true si lo consumió (popover de menciones). */
  onKeyDownCapture?: (e: KeyboardEvent<HTMLTextAreaElement>) => boolean
  onKeyUp?: KeyboardEventHandler<HTMLTextAreaElement>
  tools?: ReactNode
  attachment?: ReactNode
  overlay?: ReactNode
  quickActions?: ReactNode
  error?: string | null
}

/** Composer común: acciones rápidas, popover, adjunto, textarea autoajustable, herramientas y Enviar. */
export function ChatComposer(props: ChatComposerProps) {
  const { value, onValueChange, onSubmit, placeholder, ariaLabel, disabled, busy, maxLength, onKeyDownCapture, onKeyUp } = props
  const { tools, attachment, overlay, quickActions, error } = props
  const propio = useRef<HTMLTextAreaElement>(null)
  const ref = props.textareaRef ?? propio
  const canSubmit = (props.canSubmit ?? value.trim() !== "") && !busy && !disabled
  useAutosize(ref, value)

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (onKeyDownCapture?.(e)) return
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (canSubmit) onSubmit()
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-card px-3 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-2">
        {quickActions}
        {overlay}
        <div className="flex flex-col rounded-2xl border border-border bg-background transition-colors focus-within:border-ring/60">
          {attachment && <div className="px-3 pt-2.5">{attachment}</div>}
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onValueChange(e.target.value, e.target.selectionStart ?? 0)}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            maxLength={maxLength}
            disabled={disabled}
            rows={1}
            aria-label={ariaLabel}
            placeholder={placeholder}
            className="max-h-48 min-h-11 rounded-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="flex items-center gap-1 px-1.5 pb-1.5">
            {tools}
            <span className="flex-1" />
            <KbdGroup className="mr-1.5 hidden text-xs text-muted-foreground md:inline-flex @max-[26rem]/chat:hidden">
              <Kbd>↵</Kbd> enviar · <Kbd>⇧↵</Kbd> línea
            </KbdGroup>
            <Button
              type="button"
              size="icon-sm"
              disabled={!canSubmit}
              onClick={onSubmit}
              aria-label="Enviar mensaje"
            >
              {busy ? <Spinner /> : <ArrowUp />}
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="px-1 text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
