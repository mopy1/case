package com.casetool.backend.modules.chat.dto;

import java.util.List;

/** Lista completa (no un delta) de quién tiene la sala abierta. */
public record ChatPresenciaResponse(Long proyectoId, List<UsuarioEnSala> usuarios) {

    public record UsuarioEnSala(Long usuarioId, String username) {
    }
}
