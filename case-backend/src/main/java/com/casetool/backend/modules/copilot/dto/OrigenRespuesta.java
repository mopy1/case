package com.casetool.backend.modules.copilot.dto;

import com.casetool.backend.core.ia.motor.MotorIa;

/** Quién generó el texto: DeepSeek o Qwen en Kaggle (texto), Gemini (foto) o el manual (respaldo sin IA). */
public enum OrigenRespuesta {
    DEEPSEEK, QWEN_KAGGLE, GEMINI, MANUAL;

    /** Origen del motor de chat que efectivamente respondió. */
    public static OrigenRespuesta deMotor(MotorIa motor) {
        return motor == MotorIa.QWEN_KAGGLE ? QWEN_KAGGLE : DEEPSEEK;
    }
}
