package com.casetool.backend.modules.usuario.dto;

import java.time.Instant;

import com.casetool.backend.modules.usuario.Usuario;

public record UsuarioResponse(
        Long id,
        String username,
        String email,
        String fullname,
        Instant createdAt) {

    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getUsername(),
                usuario.getEmail(),
                usuario.getFullname(),
                usuario.getCreatedAt());
    }
}
