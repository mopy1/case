import { FileUp, ListTodo, Network, Sparkles, StickyNote } from "lucide-react"

/** `guia` = id de coach mark (`data-guia`) de la Guía de inducción. */
export const projectNavItems = [
  { label: "Diagrama", path: "diagrama", icon: Network, disabled: false, guia: "nav-diagrama" },
  { label: "Tareas", path: "tareas", icon: ListTodo, disabled: false, guia: "nav-tareas" },
  { label: "Notas", path: "notas", icon: StickyNote, disabled: false, guia: "nav-notas" },
  { label: "XMI", path: "xmi", icon: FileUp, disabled: false, guia: "nav-xmi" },
  { label: "Generador de backend", path: "generador", icon: Sparkles, disabled: false, guia: "nav-generador" },
]
