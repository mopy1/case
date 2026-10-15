package com.casetool.backend.modules.xmi.dto;

/** Elegido explícito por el ADMIN antes de confirmar un import (ver {@code XmiImportDialog} en el
 * frontend) — nunca hay un default silencioso que pueda sorprender. */
public enum ModoImportacionXmi {
    /** Agrega lo del archivo a lo que ya existe. Si una tabla del archivo tiene el mismo nombre
     * que una entidad ya presente en el proyecto, esa entidad NO se duplica ni se toca (sus
     * atributos quedan como están) — se reusa como si fuera la del archivo, y solo se crean las
     * relaciones nuevas que la conecten con el resto. */
    FUSIONAR,
    /** Vacía el diagrama actual (todas las entidades, atributos y relaciones) antes de crear lo
     * del archivo — para cuando el XMI es la nueva versión completa del modelo. */
    REEMPLAZAR
}
