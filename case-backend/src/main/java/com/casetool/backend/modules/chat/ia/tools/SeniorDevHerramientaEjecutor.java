package com.casetool.backend.modules.chat.ia.tools;

import static com.casetool.backend.modules.chat.ia.tools.SeniorDevHerramientas.*;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.casetool.backend.modules.chat.ia.SeniorDevLimites;
import com.casetool.backend.modules.chat.ia.dto.DeepSeekToolCall;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * Despacha cada tool_call a su implementación con el proyecto y el usuario que fija el servidor.
 * Nunca lanza: cualquier problema vuelve como texto "ERROR: …" para que el modelo siga.
 */
@Component
public class SeniorDevHerramientaEjecutor {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevHerramientaEjecutor.class);
    private static final TypeReference<Map<String, Object>> TIPO_ARGS = new TypeReference<>() {};

    private final HerramientasProyecto proyecto;
    private final HerramientaBuscarHistorial historial;
    private final JsonMapper jsonMapper;

    public SeniorDevHerramientaEjecutor(HerramientasProyecto proyecto, HerramientaBuscarHistorial historial,
            JsonMapper jsonMapper) {
        this.proyecto = proyecto;
        this.historial = historial;
        this.jsonMapper = jsonMapper;
    }

    public String ejecutar(DeepSeekToolCall call, Long proyectoId, Long usuarioId) {
        String nombre = call.nombre();
        log.info("Senior Dev ejecuta {} {} en proyecto {} (usuario {})", nombre, call.argumentos(), proyectoId, usuarioId);
        try {
            Map<String, Object> args = argumentos(call);
            String resultado = switch (nombre) {
                case OBTENER_DIAGRAMA -> proyecto.obtenerDiagrama(proyectoId, usuarioId, texto(args, "tabla"));
                case LISTAR_TAREAS -> proyecto.listarTareas(proyectoId, usuarioId, texto(args, "estado"), texto(args, "asignado"));
                case LISTAR_NOTAS -> proyecto.listarNotas(proyectoId, usuarioId, texto(args, "texto"), entero(args, "limite"));
                case BUSCAR_HISTORIAL -> historial.buscar(proyectoId, usuarioId, texto(args, "consulta"),
                        texto(args, "autor"), entero(args, "limite"));
                default -> "ERROR: herramienta desconocida '" + nombre + "'";
            };
            return SeniorDevLimites.recortar(resultado, SeniorDevLimites.TOOL_RESULTADO_MAX_CHARS);
        } catch (Exception ex) {
            log.warn("Herramienta {} falló en proyecto {}: {}", nombre, proyectoId, ex.getMessage());
            return "ERROR: " + (ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
        }
    }

    /** Etiqueta del indicador PENSANDO; si los argumentos no se pueden leer, la genérica de la herramienta. */
    public String etiqueta(DeepSeekToolCall call) {
        try {
            return SeniorDevHerramientas.etiqueta(call.nombre(), argumentos(call));
        } catch (Exception ex) {
            return SeniorDevHerramientas.etiqueta(call.nombre(), Map.of());
        }
    }

    private Map<String, Object> argumentos(DeepSeekToolCall call) {
        String json = call.argumentos();
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return jsonMapper.readValue(json, TIPO_ARGS);
        } catch (Exception ex) {
            throw new IllegalArgumentException("argumentos JSON inválidos");
        }
    }

    private static String texto(Map<String, Object> args, String clave) {
        Object v = args.get(clave);
        return v == null || v.toString().isBlank() ? null : v.toString().trim();
    }

    private static Integer entero(Map<String, Object> args, String clave) {
        Object v = args.get(clave);
        if (v instanceof Number n) return n.intValue();
        try {
            return v == null ? null : Integer.valueOf(v.toString().trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
