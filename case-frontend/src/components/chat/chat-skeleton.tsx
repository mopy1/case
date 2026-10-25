import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** 4 filas alternadas izquierda/derecha mientras carga el historial. */
export function ChatSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-3 sm:p-4" aria-label="Cargando mensajes">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={cn("flex gap-2", i % 2 === 1 && "flex-row-reverse")}>
          {i % 2 === 0 && <Skeleton className="size-7 shrink-0 rounded-full" />}
          <Skeleton className={cn("h-9 rounded-3xl", i % 2 === 0 ? "w-2/3" : "w-1/2")} />
        </div>
      ))}
    </div>
  )
}
