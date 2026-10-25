package com.casetool.backend.core.ia.dto;

/** Pedido de herramienta del modelo: {@code arguments} llega como texto JSON (puede venir mal formado). */
public record DeepSeekToolCall(String id, String type, Funcion function) {

    public record Funcion(String name, String arguments) {}

    public String nombre() {
        return function != null && function.name() != null ? function.name() : "";
    }

    public String argumentos() {
        return function != null ? function.arguments() : null;
    }
}
