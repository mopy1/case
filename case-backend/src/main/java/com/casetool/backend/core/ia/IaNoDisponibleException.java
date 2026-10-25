package com.casetool.backend.core.ia;

/** El proveedor de IA no está configurado o no respondió: el handler global la traduce a 503. */
public class IaNoDisponibleException extends RuntimeException {

    public IaNoDisponibleException(String message) {
        super(message);
    }
}
