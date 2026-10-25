package com.casetool.backend.modules.copilot.dto;

/** Las 7 misiones de "Primeros pasos"; mismos ids y títulos que {@code MisionId} del frontend. */
public enum MisionGuia {
    CREAR_PROYECTO("Creá un proyecto de práctica"),
    CREAR_TABLAS("Creá 2 tablas con atributos"),
    RELACIONAR("Relacioná dos tablas"),
    INVITAR("Sumá a un compañero"),
    PREGUNTAR_SENIOR_DEV("Preguntale algo a @SeniorDev"),
    APLICAR_O_ADR("Aplicá una propuesta o guardá un ADR"),
    EXPORTAR("Exportá el XMI o generá el backend");

    private final String titulo;

    MisionGuia(String titulo) {
        this.titulo = titulo;
    }

    public String titulo() {
        return titulo;
    }
}
