package com.casetool.backend.modules.seguridad.dto;

public record AuthResponse(
        Long id,
        String username,
        String email,
        String fullname,
        String token) {
}
