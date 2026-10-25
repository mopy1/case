/** Misiones de "Primeros pasos": mismas 7 cadenas que `MisionGuia` del backend. */
export type MisionId =
  | "CREAR_PROYECTO"
  | "CREAR_TABLAS"
  | "RELACIONAR"
  | "INVITAR"
  | "PREGUNTAR_SENIOR_DEV"
  | "APLICAR_O_ADR"
  | "EXPORTAR"

/** Igual a `CopilotSection` (se repite para que guia no dependa de copilot). */
export type GuiaSeccion = "diagrama" | "tareas" | "notas" | "xmi" | "generador" | "general"

export type PanelTabGuia = "equipo" | "copilot"

export interface MisionDef {
  id: MisionId
  titulo: string
  descripcion: string
  /** "Llevarme ahí": ruta absoluta (misión 1), sección del proyecto o coach marks. */
  href?: string
  ruta?: GuiaSeccion
  pasos?: GuiaPasoId[]
}

/** Ids de coach mark (`GUIA_PASO: [id]`); cada uno existe como `data-guia="id"` en el JSX. */
export type GuiaPasoId =
  | "nav-diagrama"
  | "nav-tareas"
  | "nav-notas"
  | "nav-xmi"
  | "nav-generador"
  | "nav-colaboradores"
  | "diagrama-nueva-entidad"
  | "diagrama-atributo"
  | "panel-equipo"
  | "equipo-seniordev"
  | "xmi-exportar"
  | "generador-descargar"
  | "generador-ddl"
  | "copilot-modo"

export interface GuiaPasoDef {
  id: GuiaPasoId
  titulo: string
  texto: string
  ruta?: GuiaSeccion
  zona: "rail" | "main" | "panel"
  tab?: PanelTabGuia
  lado: "top" | "right" | "bottom" | "left"
  ayudaSiFalta?: string
}

export interface GuiaProgreso {
  v: 1
  estado: "pendiente" | "omitida" | "completada"
  /** La oferta automática ya ocurrió. */
  ofrecida: boolean
  /** "Ver más tarde". */
  colapsada: boolean
  logradas: MisionId[]
}

export interface GuiaPanelDetail {
  tab?: PanelTabGuia
  modoGuia?: boolean
  seccion?: GuiaSeccion
  cerrar?: boolean
}

export interface GuiaPasoDetail {
  pasos: GuiaPasoId[]
}

export interface ArtifactExportedDetail {
  proyectoId: number
  tipo: "xmi" | "backend"
}

export interface ChatSentDetail {
  proyectoId: number
  mencionaIa: boolean
}
