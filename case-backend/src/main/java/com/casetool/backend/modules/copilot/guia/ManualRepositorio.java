package com.casetool.backend.modules.copilot.guia;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Carga el manual una sola vez al arrancar. Es un recurso propio del repo: si falta o está mal formado
 * el arranque falla (mejor enterarse en el build que con una Guía muda en producción).
 */
@Component
public class ManualRepositorio {

    static final String RUTA = "guia/manual.json";
    static final Set<String> SECCIONES = Set.of("diagrama", "tareas", "notas", "xmi", "generador", "general");

    private final List<ManualTema> temas;

    public ManualRepositorio(JsonMapper jsonMapper) {
        try (InputStream in = new ClassPathResource(RUTA).getInputStream()) {
            this.temas = List.copyOf(jsonMapper.readValue(in, new TypeReference<List<ManualTema>>() {}));
        } catch (Exception ex) {
            throw new IllegalStateException("No se pudo cargar el manual " + RUTA + ": " + ex.getMessage(), ex);
        }
        validar(temas);
    }

    public List<ManualTema> temas() {
        return temas;
    }

    private static void validar(List<ManualTema> temas) {
        if (temas.isEmpty()) throw new IllegalStateException("El manual está vacío");
        Set<String> ids = new HashSet<>();
        for (ManualTema t : temas) {
            if (vacio(t.id()) || vacio(t.titulo()) || vacio(t.contenido()) || !SECCIONES.contains(t.seccion())) {
                throw new IllegalStateException("Tema del manual incompleto o con sección inválida: " + t.id());
            }
            if (!ids.add(t.id())) throw new IllegalStateException("Tema del manual repetido: " + t.id());
        }
    }

    private static boolean vacio(String s) {
        return s == null || s.isBlank();
    }
}
