package com.casetool.backend.modules.chat.dto;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.seguridad.model.Usuario;

/** Mismo JSON para el POST 201, el historial y el tópico /topic/proyectos/{id}/chat. */
public record ChatMensajeResponse(
    Long id,
    Long proyectoId,
    Long usuarioId,
    String username,
    MiembroProyecto.Rol rol,
    ChatMensaje.Tipo tipo,
    String contenido,
    Long respuestaAId,
    Instant createdAt,
    Boolean propuestaAplicada,
    String aplicadoPor,
    List<String> herramientasUsadas
) {
    /** {@code rol} es el rol ACTUAL del autor (null si es IA/SISTEMA o ya no es miembro). */
    public static ChatMensajeResponse from(ChatMensaje m, MiembroProyecto.Rol rol) {
        Usuario autor = m.getUsuario();
        return new ChatMensajeResponse(
            m.getId(),
            m.getProyecto().getId(),
            autor != null ? autor.getId() : null,
            autor != null ? autor.getUsername() : null,
            rol,
            m.getTipo(),
            m.getContenido(),
            m.getRespuestaA() != null ? m.getRespuestaA().getId() : null,
            m.getCreatedAt(),
            m.isPropuestaAplicada(),
            m.getAplicadoPor(),
            herramientas(m.getHerramientasUsadas())
        );
    }

    /** "obtenerDiagrama,buscarEnHistorial" → lista; null o vacío → null. */
    static List<String> herramientas(String csv) {
        if (csv == null || csv.isBlank()) {
            return null;
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
