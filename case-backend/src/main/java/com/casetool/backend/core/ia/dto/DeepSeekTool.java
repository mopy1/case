package com.casetool.backend.core.ia.dto;

import java.util.Map;

/** Definición de una herramienta (function calling) con su JSON Schema de parámetros. */
public record DeepSeekTool(String type, Funcion function) {

    public record Funcion(String name, String description, Map<String, Object> parameters) {}

    public static DeepSeekTool funcion(String name, String description, Map<String, Object> parameters) {
        return new DeepSeekTool("function", new Funcion(name, description, parameters));
    }
}
