package com.casetool.backend.core.ia.motor.dto;

import java.util.List;

/** Resultado de la prueba: con Kaggle caído {@code ok=false} y {@code error} legible (nunca 5xx). */
public record MotorIaProbarResponse(boolean ok, List<String> modelos, Long latenciaMs, String error) {

    public static MotorIaProbarResponse exito(List<String> modelos, long latenciaMs) {
        return new MotorIaProbarResponse(true, modelos, latenciaMs, null);
    }

    public static MotorIaProbarResponse fallo(String error) {
        return new MotorIaProbarResponse(false, List.of(), null, error);
    }
}
