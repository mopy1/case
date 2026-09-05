package com.casetool.backend.modules.seguridad.dto;

import java.time.Instant;

import com.casetool.backend.modules.seguridad.model.Usuario;

public record UsuarioResponse(
        Long id,
        String username,
        String email,
        Instant createdAt) {

    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getCreatedAt());
    }
}
