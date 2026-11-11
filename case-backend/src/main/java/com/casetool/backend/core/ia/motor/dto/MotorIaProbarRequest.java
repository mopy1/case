package com.casetool.backend.core.ia.motor.dto;

import jakarta.validation.constraints.NotBlank;

/** POST /api/ia/motor/probar: URL del túnel ngrok a probar (no se guarda). */
public record MotorIaProbarRequest(@NotBlank String url) {
}
