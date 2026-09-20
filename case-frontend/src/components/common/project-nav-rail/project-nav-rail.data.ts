import { FileUp, ListTodo, Network, Sparkles, StickyNote } from "lucide-react"

export const projectNavItems = [
  { label: "Diagrama", path: "diagrama", icon: Network, disabled: false },
  { label: "Tareas", path: "tareas", icon: ListTodo, disabled: false },
  { label: "Notas", path: "notas", icon: StickyNote, disabled: false },
  { label: "XMI", path: "xmi", icon: FileUp, disabled: false },
  { label: "Generador de backend", path: "generador", icon: Sparkles, disabled: false },
]
