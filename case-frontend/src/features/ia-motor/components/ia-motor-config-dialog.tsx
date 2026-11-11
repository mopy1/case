import { useRef, type RefObject } from "react"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useIaMotorConfig } from "../hooks/useIaMotorConfig"
import { IaMotorProbeResult } from "./ia-motor-probe-result"

interface IaMotorConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  urlInicial: string | null
}

/** Formulario aparte: se monta al abrir el diálogo, así cada apertura arranca limpia. */
interface FormProps {
  urlInicial: string
  onGuardado: () => void
  inputRef: RefObject<HTMLInputElement | null>
}

function IaMotorConfigForm({ urlInicial, onGuardado, inputRef }: FormProps) {
  const f = useIaMotorConfig(urlInicial, onGuardado)
  const ocupado = f.probando || f.guardando

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        void f.guardar()
      }}
    >
      <FieldGroup>
        <Field data-invalid={Boolean(f.error)}>
          <FieldLabel htmlFor="ia-motor-url">URL base del endpoint</FieldLabel>
          <Input
            id="ia-motor-url"
            ref={inputRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://xxxx.ngrok-free.dev/v1"
            value={f.url}
            onChange={(e) => f.setUrl(e.target.value)}
            aria-invalid={Boolean(f.error)}
            aria-describedby="ia-motor-url-ayuda"
            className="font-mono text-xs"
            required
          />
          <FieldDescription id="ia-motor-url-ayuda">
            La URL de ngrok cambia en cada sesión de Kaggle: pegá la nueva cada vez que arranques el notebook. Si el endpoint se cae, el
            Copilot y Senior Dev usan DeepSeek automáticamente.
          </FieldDescription>
          <FieldError>{f.error}</FieldError>
        </Field>
        <IaMotorProbeResult prueba={f.prueba} probando={f.probando} />
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="ghost" />}>Cancelar</DialogClose>
        <Button type="button" variant="outline" disabled={ocupado || !f.url.trim()} onClick={() => void f.probar()}>
          {f.probando && <Spinner data-icon="inline-start" />}
          Probar conexión
        </Button>
        <Button type="submit" disabled={ocupado || !f.url.trim()}>
          {f.guardando && <Spinner data-icon="inline-start" />}
          Guardar y usar
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Diálogo "Configurar endpoint" de Qwen 3.5 MoE en Kaggle (llama.cpp detrás de ngrok). */
export function IaMotorConfigDialog({ open, onOpenChange, urlInicial }: IaMotorConfigDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" initialFocus={inputRef}>
        <DialogHeader>
          <DialogTitle>Qwen 3.5 MoE en Kaggle</DialogTitle>
          <DialogDescription>Conectá el servidor llama.cpp del notebook. El backend hace las llamadas; la URL solo la ves vos.</DialogDescription>
        </DialogHeader>
        {open && <IaMotorConfigForm urlInicial={urlInicial ?? ""} onGuardado={() => onOpenChange(false)} inputRef={inputRef} />}
      </DialogContent>
    </Dialog>
  )
}
