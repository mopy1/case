export const API_URL = import.meta.env.VITE_API_URL ?? ""

export async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

/** Texto para mostrar de un error atrapado en un `catch` (tipado `unknown`): su `message` si es un
 * `Error` con texto, si no el `fallback`. Reemplaza al patrón `catch (err: any) { err.message || ... }`. */
export function mensajeDeError(err: unknown, fallback = "No se pudo conectar con el servidor"): string {
  return err instanceof Error && err.message ? err.message : fallback
}

interface ApiFetchOptions extends RequestInit {
  errorFallback?: string
  /** true: devuelve el `Response` crudo sin parsear como JSON — para descargas de archivo (XMI,
   * ver `features/xmi`), donde el caller necesita `.blob()` en vez de un objeto. */
  raw?: boolean
  /** Corte de la petición en ms (por defecto 15 s). Se combina con `signal` si el caller pasa uno. */
  timeoutMs?: number
}

export const API_TIMEOUT_MS = 15_000

/** `fetch` con corte por tiempo: un backend caído o colgado falla con un mensaje legible en vez de esperar sin fin. */
async function fetchConTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const corte = AbortSignal.timeout(timeoutMs)
  const signal = init.signal ? AbortSignal.any([init.signal, corte]) : corte
  try {
    return await fetch(url, { ...init, signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") throw new Error("El servidor no respondió a tiempo")
    if (err instanceof TypeError) throw new Error("No se pudo conectar con el servidor")
    throw err
  }
}

/** Fetch autenticado: agrega el Bearer token, y si el backend devuelve 401
 * (token vencido o inválido) limpia la sesión y manda a /login. */
export async function apiFetch<T = void>(
  path: string,
  { errorFallback, headers, raw, timeoutMs = API_TIMEOUT_MS, ...options }: ApiFetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem("token")
  // FormData (subida de archivos, ver `features/xmi`) arma su propio Content-Type con el
  // boundary del multipart — fijarlo a mano a "application/json" rompería el body.
  const esFormData = options.body instanceof FormData
  const response = await fetchConTimeout(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        ...(options.body && !esFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    },
    timeoutMs
  )

  if (response.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    if (window.location.pathname !== "/login") {
      window.location.assign("/login")
    }
    throw new Error("Tu sesión expiró, iniciá sesión de nuevo")
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, errorFallback ?? "Error al procesar la solicitud"))
  }

  if (raw) {
    return response as T
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
