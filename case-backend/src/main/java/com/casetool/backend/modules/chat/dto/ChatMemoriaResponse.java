package com.casetool.backend.modules.chat.dto;

import java.time.Instant;

import com.casetool.backend.modules.chat.model.ChatMemoria;

/** Memoria vigente del equipo; sin fila todavía → todo null salvo {@code proyectoId} (200, no 404). */
public record ChatMemoriaResponse(
    Long proyectoId,
    String resumen,
    Long ultimoMensajeResumidoId,
    Instant updatedAt
) {
    public static ChatMemoriaResponse from(ChatMemoria m) {
        return new ChatMemoriaResponse(m.getProyectoId(), m.getResumen(), m.getUltimoMensajeResumidoId(), m.getUpdatedAt());
    }

    public static ChatMemoriaResponse vacia(Long proyectoId) {
        return new ChatMemoriaResponse(proyectoId, null, null, null);
    }
}
