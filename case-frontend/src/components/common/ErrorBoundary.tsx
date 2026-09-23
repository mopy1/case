import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  /** Se resetea el estado de error cuando este valor cambia (ej. la ruta actual) — así navegar
   * a otra sección del proyecto no queda atrapado mostrando el error de la sección anterior. */
  resetKey?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/** React no desmonta solo el componente que tira la excepción al renderizar — desmonta todo el
 * árbol hasta el primer ErrorBoundary que la capture, y si no hay ninguno, hasta la raíz: la app
 * entera queda en blanco. Esta app no tenía ningún ErrorBoundary, así que cualquier bug de
 * renderizado en cualquier página (ej. leer un campo de un objeto que llegó undefined) dejaba
 * literalmente la pantalla en blanco sin ningún mensaje. Este componente evita eso en el área de
 * contenido de un proyecto, mostrando un error recuperable en vez de una pantalla vacía. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary atrapó una excepción de render:", error, info.componentStack)
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <div>
            <p className="font-semibold text-foreground">Esta sección tuvo un error inesperado</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {this.state.error.message || "Ocurrió un problema al mostrar esta pantalla."}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
            Reintentar
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
