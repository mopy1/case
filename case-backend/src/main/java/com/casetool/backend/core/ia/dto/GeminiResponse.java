package com.casetool.backend.core.ia.dto;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Solo lo que se lee de la respuesta de Gemini: el texto del primer candidato. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiResponse(List<Candidato> candidates) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Candidato(Contenido content) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Contenido(List<Parte> parts) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Parte(String text) {}

    /** Une las partes de texto del primer candidato; "" si vino vacío. */
    public String texto() {
        if (candidates == null || candidates.isEmpty()) return "";
        Contenido c = candidates.get(0).content();
        if (c == null || c.parts() == null) return "";
        return c.parts().stream().map(Parte::text).filter(Objects::nonNull)
                .collect(Collectors.joining()).trim();
    }
}
