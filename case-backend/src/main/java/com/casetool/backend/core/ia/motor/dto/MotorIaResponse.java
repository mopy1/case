package com.casetool.backend.core.ia.motor.dto;

import com.casetool.backend.core.ia.motor.MotorIa;

/** Motor elegido por el usuario; {@code urlKaggle} normalizada (termina en /v1) o null con DEEPSEEK. */
public record MotorIaResponse(MotorIa motor, String urlKaggle) {
}
