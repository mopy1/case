package com.casetool.backend.modules.usuario.dto;

public record AuthResponse(
        Long id,
        String username,
        String email,
        String fullname,
        String token) {
}
