package com.casetool.backend.modules.seguridad.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "El username es obligatorio") @Size(max = 50) String username,
        @NotBlank(message = "El email es obligatorio") @Email @Size(max = 100) String email,
        @NotBlank(message = "El password es obligatorio") @Size(min = 6, max = 255) String password,
        @NotBlank(message = "El nombre completo es obligatorio") @Size(max = 150) String fullname) {
}
