import type { MisionDef, MisionId } from "../types/guia.types"

/** Las 7 misiones de "Primeros pasos" (títulos iguales a `MisionGuia.titulo` del backend). */
export const MISIONES: MisionDef[] = [
  {
    id: "CREAR_PROYECTO",
    titulo: "Creá un proyecto de práctica",
    descripcion: "Desde Proyectos › \"Nuevo proyecto\". Te sugerimos «Práctica — Biblioteca».",
    href: "/proyectos?nuevo=practica",
  },
  {
    id: "CREAR_TABLAS",
    titulo: "Creá 2 tablas con atributos",
    descripcion: "Botón \"Entidad\" en el diagrama y después sus columnas en el panel de la tabla.",
    pasos: ["diagrama-nueva-entidad", "diagrama-atributo"],
  },
  {
    id: "RELACIONAR",
    titulo: "Relacioná dos tablas",
    descripcion: "Arrastrá desde el borde de una tabla hasta otra. Probá una N:M: la tabla intermedia se crea sola.",
    ruta: "diagrama",
  },
  {
    id: "INVITAR",
    titulo: "Sumá a un compañero",
    descripcion: "Colaboradores › \"Agregar colaborador\" (solo ADMIN).",
    pasos: ["nav-colaboradores"],
  },
  {
    id: "PREGUNTAR_SENIOR_DEV",
    titulo: "Preguntale algo a @SeniorDev",
    descripcion: "En la sala del equipo, mencioná a @SeniorDev con una duda del modelo.",
    pasos: ["equipo-seniordev"],
  },
  {
    id: "APLICAR_O_ADR",
    titulo: "Aplicá una propuesta o guardá un ADR",
    descripcion: "Aplicá los cambios que propone Senior Dev o registrá una decisión en Notas.",
    pasos: ["panel-equipo"],
  },
  {
    id: "EXPORTAR",
    titulo: "Exportá el XMI o generá el backend",
    descripcion: "XMI › \"Exportar XMI\" o Generador › \"Descargar Proyecto (.ZIP)\".",
    pasos: ["xmi-exportar"],
  },
]

export const TOTAL_MISIONES = MISIONES.length

export const MISION_IDS: MisionId[] = MISIONES.map((m) => m.id)
