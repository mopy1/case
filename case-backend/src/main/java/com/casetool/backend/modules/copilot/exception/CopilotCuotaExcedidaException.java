package com.casetool.backend.modules.copilot.exception;

/** Más de 20 consultas del mismo usuario en 60 s → 429 (el endpoint gasta la clave del servidor). */
public class CopilotCuotaExcedidaException extends RuntimeException {

    public CopilotCuotaExcedidaException(String message) {
        super(message);
    }
}
