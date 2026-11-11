package com.casetool.backend.core.ia.motor.dto;

import com.casetool.backend.core.ia.motor.MotorIa;

import jakarta.validation.constraints.NotNull;

/** PUT /api/ia/motor: {@code urlKaggle} es obligatoria con QWEN_KAGGLE y se ignora con DEEPSEEK. */
public record MotorIaRequest(@NotNull MotorIa motor, String urlKaggle) {
}
