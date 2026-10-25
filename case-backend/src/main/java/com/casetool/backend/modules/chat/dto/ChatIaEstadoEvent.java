package com.casetool.backend.modules.chat.dto;

/** Evento efímero de estado de la IA emitido a /topic/proyectos/{id}/chat/ia. */
public record ChatIaEstadoEvent(
    Long proyectoId,
    Estado estado,
    String detalle,
    Long respuestaAId
) {
    public enum Estado {
        PENSANDO,
        RESPONDIDO,
        ERROR
    }
}
