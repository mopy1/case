import { RotateCcw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export interface ChatErrorProps {
  title: string
  message: string
  onRetry: () => void
  retrying?: boolean
}

/** Error de carga del historial con "Reintentar". */
export function ChatError({ title, message, onRetry, retrying }: ChatErrorProps) {
  return (
    <div className="flex-1 p-3">
      <Alert variant="destructive">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          <p>{message}</p>
          <Button variant="outline" size="sm" disabled={retrying} onClick={onRetry}>
            {retrying ? <Spinner data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" />}
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
