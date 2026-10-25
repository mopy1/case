import { useRef } from "react"
import { Camera, X } from "lucide-react"
import { ChatComposerButton } from "@/components/chat"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment"
import type { ProcessedImage } from "../lib/copilotImageUtils"

interface CopilotImageButtonProps {
  disabled?: boolean
  onImageSelected: (file: File) => void
}

/** Botón "adjuntar foto del diagrama" (abre la cámara en móvil). */
export function CopilotImageButton({ disabled, onImageSelected }: CopilotImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onImageSelected(file)
          e.target.value = ""
        }}
      />
      <ChatComposerButton icon={Camera} label="Adjuntar foto de un diagrama" onClick={() => inputRef.current?.click()} disabled={disabled} />
    </>
  )
}

interface CopilotImagePreviewProps {
  image: ProcessedImage | null
  processing: boolean
  onRemove: () => void
}

/** Vista previa de la foto adjunta dentro del composer. */
export function CopilotImagePreview({ image, processing, onRemove }: CopilotImagePreviewProps) {
  if (!image && !processing) return null
  return (
    <Attachment size="sm" state={processing ? "processing" : "done"}>
      <AttachmentMedia variant="image">{image && <img src={image.previewUrl} alt="" />}</AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{processing ? "Procesando foto…" : "Foto del diagrama"}</AttachmentTitle>
      </AttachmentContent>
      {image && (
        <AttachmentActions>
          <AttachmentAction aria-label="Quitar foto" onClick={onRemove}>
            <X />
          </AttachmentAction>
        </AttachmentActions>
      )}
    </Attachment>
  )
}
