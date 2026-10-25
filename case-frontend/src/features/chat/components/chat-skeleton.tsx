import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-3 sm:p-4" aria-label="Cargando mensajes">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-2.5">
          <Skeleton className="size-6 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
