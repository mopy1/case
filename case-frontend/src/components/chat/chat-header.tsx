import type { ReactNode } from "react"

export interface ChatHeaderProps {
  title: string
  description?: ReactNode
  leading?: ReactNode
  actions?: ReactNode
  /** Aviso bajo la cabecera (filtro activo, modo autónomo). */
  banner?: ReactNode
}

/** Cabecera de 48 px, igual en Equipo y Copilot. */
export function ChatHeader({ title, description, leading, actions, banner }: ChatHeaderProps) {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-3">
        {leading}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-sm font-medium">{title}</h2>
          {description && <div className="truncate text-xs text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
      </header>
      {banner && <div className="shrink-0 border-b border-border px-3 py-1.5">{banner}</div>}
    </>
  )
}
