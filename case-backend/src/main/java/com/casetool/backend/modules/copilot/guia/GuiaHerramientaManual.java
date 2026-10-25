package com.casetool.backend.modules.copilot.guia;

import static com.casetool.backend.modules.copilot.service.CopilotLimites.MANUAL_RESULTADO_MAX_CHARS;
import static com.casetool.backend.modules.copilot.service.CopilotLimites.MANUAL_TOP;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.core.ia.dto.DeepSeekTool;
import com.casetool.backend.core.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.copilot.service.CopilotLimites;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/** Herramienta {@code buscarManual} de la Guía. Nunca lanza: los problemas vuelven como "ERROR: …". */
@Component
public class GuiaHerramientaManual {

    public static final String NOMBRE = "buscarManual";

    public static final DeepSeekTool DEFINICION = DeepSeekTool.funcion(NOMBRE,
            "Busca en el manual de uso de la CASE Tool (botones, pantallas, pasos). Úsala antes de explicar cómo se hace algo",
            Map.of("type", "object",
                    "properties", Map.of("consulta", Map.of("type", "string",
                            "description", "Qué función o pantalla buscar, en pocas palabras")),
                    "required", List.of("consulta")));

    private static final TypeReference<Map<String, Object>> TIPO_ARGS = new TypeReference<>() {};

    private final ManualBuscador buscador;
    private final JsonMapper jsonMapper;

    public GuiaHerramientaManual(ManualBuscador buscador, JsonMapper jsonMapper) {
        this.buscador = buscador;
        this.jsonMapper = jsonMapper;
    }

    public String ejecutar(DeepSeekToolCall call, String seccion) {
        try {
            String json = call.argumentos();
            Map<String, Object> args = json == null || json.isBlank() ? Map.of() : jsonMapper.readValue(json, TIPO_ARGS);
            Object consulta = args.get("consulta");
            if (consulta == null || consulta.toString().isBlank()) return "ERROR: falta el argumento consulta";
            return buscar(consulta.toString().trim(), seccion);
        } catch (Exception ex) {
            return "ERROR: argumentos JSON inválidos";
        }
    }

    /** Los 2 mejores temas como texto para el modelo, recortado a 3000 caracteres. */
    public String buscar(String consulta, String seccion) {
        List<ManualTema> temas = buscador.buscar(consulta, seccion, MANUAL_TOP);
        if (temas.isEmpty()) return "SIN_RESULTADOS: el manual no cubre «" + consulta + "»";
        String texto = temas.stream()
                .map(t -> "### " + t.titulo() + " (sección " + t.seccion() + ")\n" + t.contenido())
                .collect(Collectors.joining("\n\n"));
        return CopilotLimites.recortar(texto, MANUAL_RESULTADO_MAX_CHARS);
    }
}
