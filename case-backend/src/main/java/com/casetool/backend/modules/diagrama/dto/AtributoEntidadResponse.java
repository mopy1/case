package com.casetool.backend.modules.diagrama.dto;

import com.casetool.backend.modules.diagrama.model.AtributoEntidad;

public record AtributoEntidadResponse(
    Long id,
    Long entidadId,
    String nombre,
    String tipoSql,
    boolean esPk,
    boolean esFk,
    Long referenciaEntidadId,
    String referenciaEntidadNombre,
    boolean nullable
) {
    public static AtributoEntidadResponse from(AtributoEntidad atributo) {
        return new AtributoEntidadResponse(
            atributo.getId(),
            atributo.getEntidad().getId(),
            atributo.getNombre(),
            atributo.getTipoSql(),
            atributo.isEsPk(),
            atributo.isEsFk(),
            atributo.getReferenciaEntidad() != null ? atributo.getReferenciaEntidad().getId() : null,
            atributo.getReferenciaEntidad() != null ? atributo.getReferenciaEntidad().getNombre() : null,
            atributo.isNullable()
        );
    }
}
