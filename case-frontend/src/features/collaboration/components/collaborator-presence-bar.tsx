import { cn } from "cn"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CollaboratorPresence } from "../types/collaboration.types"
import { getInitials } from "../lib/collaborationUtils"

interface CollaboratorPresenceBarProps {
  collaborators: CollaboratorPresence[]
  className?: string
}

export function CollaboratorPresenceBar({
  collaborators,
  className,
}: CollaboratorPresenceBarProps) {
  return (
    <TooltipProvider delay={100}>
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border border-border/80 bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-md select-none",
          className
        )}
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden sm:inline font-medium">Colaboración activa</span>
        </div>

        <div className="h-4 w-px bg-border/70" />

        <div className="flex items-center -space-x-1.5">
          {collaborators.map((c) => (
            <Tooltip key={c.id}>
              <TooltipTrigger
                className="relative inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-card shadow-xs transition-transform hover:z-20 hover:scale-110"
                style={{ backgroundColor: c.color }}
              >
                {getInitials(c.username)}
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center text-xs">
                <div className="font-semibold text-foreground">{c.username}</div>
                <div className="text-[11px] text-emerald-500 font-medium">● En línea</div>
              </TooltipContent>
            </Tooltip>
          ))}

          {collaborators.length === 0 && (
            <span className="text-[11px] text-muted-foreground px-1">
              Esperando colaboradores...
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
