import type {
  ArtifactExportedDetail,
  ChatSentDetail,
  GuiaPanelDetail,
  GuiaPasoDetail,
  GuiaPasoId,
  GuiaSeccion,
  PanelTabGuia,
} from "../types/guia.types"

/** Eventos de ventana de la inducción (contrato interno, §3.4 de la spec F5). */
export const EVENTO = {
  panel: "guia:panel",
  paso: "guia:paso",
  exportado: "project:artifact-exported",
  miembros: "project:member-changed",
  chatEnviado: "project:chat-sent",
} as const

function emitir<T>(nombre: string, detail: T) {
  window.dispatchEvent(new CustomEvent<T>(nombre, { detail }))
}

/** Abre el panel en el Copilot, modo Guía (con sugerencias de `seccion` si viene). */
export const abrirGuia = (seccion?: GuiaSeccion) => emitir<GuiaPanelDetail>(EVENTO.panel, { tab: "copilot", modoGuia: true, seccion })

export const abrirPanel = (tab: PanelTabGuia) => emitir<GuiaPanelDetail>(EVENTO.panel, { tab })

export const cerrarPanel = () => emitir<GuiaPanelDetail>(EVENTO.panel, { cerrar: true })

export const mostrarPasos = (pasos: GuiaPasoId[]) => emitir<GuiaPasoDetail>(EVENTO.paso, { pasos })

export const notificarExportacion = (proyectoId: number, tipo: ArtifactExportedDetail["tipo"]) =>
  emitir<ArtifactExportedDetail>(EVENTO.exportado, { proyectoId, tipo })

export const notificarMiembros = (proyectoId: number) => emitir(EVENTO.miembros, { proyectoId })

export const notificarChatEnviado = (proyectoId: number, contenido: string) =>
  emitir<ChatSentDetail>(EVENTO.chatEnviado, { proyectoId, mencionaIa: /@seniordev\b/i.test(contenido) })

/** Suscribe un oyente tipado y devuelve la función de limpieza (para `useEffect`). */
export function escuchar<T>(nombre: string, oyente: (detail: T) => void): () => void {
  const handler = (e: Event) => oyente((e as CustomEvent<T>).detail)
  window.addEventListener(nombre, handler)
  return () => window.removeEventListener(nombre, handler)
}
