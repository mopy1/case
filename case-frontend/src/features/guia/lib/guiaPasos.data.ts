import type { GuiaPasoDef, GuiaPasoId } from "../types/guia.types"

const nav = (id: GuiaPasoId, nombre: string, texto: string): GuiaPasoDef => ({ id, titulo: nombre, texto, zona: "rail", lado: "right" })

/** Coach marks: cada id existe como `data-guia="id"` en el JSX (lista igual a `GuiaPrompts` del backend). */
const PASOS: GuiaPasoDef[] = [
  nav("nav-diagrama", "Diagrama", "Acá modelás las tablas, sus atributos y las relaciones."),
  nav("nav-tareas", "Tareas", "Kanban del equipo: Pendiente, En progreso y Hecho."),
  nav("nav-notas", "Notas", "Decisiones de arquitectura (ADR) del proyecto."),
  nav("nav-xmi", "XMI", "Exportá o importá el modelo para Enterprise Architect."),
  nav("nav-generador", "Generador de backend", "Generá un proyecto Spring Boot a partir del diagrama."),
  nav("nav-colaboradores", "Colaboradores", "Abrí este diálogo y usá \"Agregar colaborador\" con el usuario o email de tu compañero."),
  {
    id: "diagrama-nueva-entidad",
    titulo: "Nueva tabla",
    texto: "Pulsá \"Entidad\", escribí el nombre y \"Crear tabla\".",
    ruta: "diagrama",
    zona: "main",
    lado: "bottom",
  },
  {
    id: "diagrama-atributo",
    titulo: "Atributos",
    texto: "Con la tabla seleccionada, agregá sus columnas desde este botón.",
    ruta: "diagrama",
    zona: "main",
    lado: "left",
    ayudaSiFalta: "Seleccioná una tabla para ver sus atributos.",
  },
  {
    id: "panel-equipo",
    titulo: "Sala del equipo",
    texto: "Acá conversa todo el equipo; las propuestas de Senior Dev se aplican con \"Aplicar\".",
    zona: "panel",
    tab: "equipo",
    lado: "bottom",
  },
  {
    id: "equipo-seniordev",
    titulo: "Mencionar a Senior Dev",
    texto: "Agrega @SeniorDev al mensaje: escribí tu duda del modelo y envialo.",
    zona: "panel",
    tab: "equipo",
    lado: "top",
  },
  { id: "xmi-exportar", titulo: "Exportar XMI", texto: "Descarga el modelo en XMI 1.1 para Enterprise Architect.", ruta: "xmi", zona: "main", lado: "bottom" },
  {
    id: "generador-descargar",
    titulo: "Descargar el backend",
    texto: "Genera el ZIP del proyecto Spring Boot con entidades, servicios y controladores.",
    ruta: "generador",
    zona: "main",
    lado: "bottom",
  },
  { id: "generador-ddl", titulo: "DDL PostgreSQL", texto: "Mirá o descargá el SQL de creación del modelo.", ruta: "generador", zona: "main", lado: "bottom" },
  {
    id: "copilot-modo",
    titulo: "Asistente o Guía",
    texto: "El Asistente construye en tu diagrama; la Guía te explica cómo usar la herramienta.",
    zona: "panel",
    tab: "copilot",
    lado: "bottom",
  },
]

export const GUIA_PASOS: Record<GuiaPasoId, GuiaPasoDef> = Object.fromEntries(PASOS.map((p) => [p.id, p])) as Record<
  GuiaPasoId,
  GuiaPasoDef
>

export function esPasoId(id: string): id is GuiaPasoId {
  return Object.hasOwn(GUIA_PASOS, id)
}
