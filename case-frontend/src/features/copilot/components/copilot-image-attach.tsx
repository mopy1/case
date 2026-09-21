import { useRef } from "react"
import { Camera, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProcessedImage } from "../lib/copilotImageUtils"

interface CopilotImageAttachProps {
  attachedImage: ProcessedImage | null
  isProcessing: boolean
  disabled?: boolean
  onImageSelected: (file: File) => void
  onRemoveImage: () => void
}

export function CopilotImageAttach({
  attachedImage,
  isProcessing,
  disabled,
  onImageSelected,
  onRemoveImage,
}: CopilotImageAttachProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelected(file)
    }
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || isProcessing}
      />

      {attachedImage ? (
        <div className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary transition-colors">
          <img
            src={attachedImage.previewUrl}
            alt="Preview"
            className="size-4.5 rounded object-cover border border-primary/30"
          />
          <span className="font-medium max-w-[80px] truncate">Foto lista</span>
          <button
            type="button"
            onClick={onRemoveImage}
            className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-primary/20 hover:text-foreground cursor-pointer"
            title="Quitar foto"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isProcessing}
          title="Tomar foto de diagrama o adjuntar imagen"
          className="size-8 sm:size-7 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          {isProcessing ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <Camera className="size-3.5" />
          )}
        </Button>
      )}
    </div>
  )
}
