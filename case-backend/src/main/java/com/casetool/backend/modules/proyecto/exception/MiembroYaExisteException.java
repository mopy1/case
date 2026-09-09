package com.casetool.backend.modules.proyecto.exception;

public class MiembroYaExisteException extends RuntimeException {
    public MiembroYaExisteException(String message) {
        super(message);
    }
}
