package com.casetool.backend.core.ia.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Body de POST /models/{modelo}:generateContent: texto + imagen JPEG en base64 y la instrucción de sistema. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GeminiRequest(List<Contenido> contents, Contenido systemInstruction) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Contenido(String role, List<Parte> parts) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Parte(String text, DatosEnLinea inlineData) {}

    public record DatosEnLinea(String mimeType, String data) {}

    public static GeminiRequest de(String instruccion, String texto, String imagenBase64) {
        Contenido usuario = new Contenido("user", List.of(
                new Parte(texto, null),
                new Parte(null, new DatosEnLinea("image/jpeg", imagenBase64))));
        Contenido sistema = new Contenido(null, List.of(new Parte(instruccion, null)));
        return new GeminiRequest(List.of(usuario), sistema);
    }
}
