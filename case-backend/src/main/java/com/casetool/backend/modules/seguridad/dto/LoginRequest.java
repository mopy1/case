package com.casetool.backend.modules.seguridad.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Debe ingresar usuario o email") @Size(max = 100) String usernameOrEmail,
        @NotBlank(message = "Debe ingresar password") @Size(max = 255) String password) {
}
