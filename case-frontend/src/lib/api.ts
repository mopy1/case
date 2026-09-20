export const API_URL = import.meta.env.VITE_API_URL ?? ""

async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const error = await response.json().catch(() => null)
  return error?.message ?? fallback
}

interface ApiFetchOptions extends RequestInit {
  errorFallback?: string
  /** true: devuelve el `Response` crudo sin parsear como JSON — para descargas de archivo (XMI,
   * ver `features/xmi`), donde el caller necesita `.blob()` en vez de un objeto. */
  raw?: boolean
}

/** Fetch autenticado: agrega el Bearer token, y si el backend devuelve 401
 * (token vencido o inválido) limpia la sesión y manda a /login. */
export async function apiFetch<T = void>(
  path: string,
  { errorFallback, headers, raw, ...options }: ApiFetchOptions = {}
): Promise<T> {
  const token = localStorage.getItem("token")
  // FormData (subida de archivos, ver `features/xmi`) arma su propio Content-Type con el
  // boundary del multipart — fijarlo a mano a "application/json" rompería el body.
  const esFormData = options.body instanceof FormData
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body && !esFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

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
