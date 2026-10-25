package com.casetool.backend.modules.chat.ia.tools;

import java.util.List;
import java.util.Map;

import com.casetool.backend.core.ia.dto.DeepSeekTool;

/**
 * Las 4 herramientas de solo lectura que se le ofrecen a DeepSeek. El {@code proyectoId} NUNCA es
 * parámetro: lo fija el servidor con el proyecto del mensaje que disparó la consulta.
 */
public final class SeniorDevHerramientas {

    public static final String OBTENER_DIAGRAMA = "obtenerDiagrama";
    public static final String LISTAR_TAREAS = "listarTareas";
    public static final String LISTAR_NOTAS = "listarNotas";
    public static final String BUSCAR_HISTORIAL = "buscarEnHistorial";

    public static final List<String> NOMBRES = List.of(OBTENER_DIAGRAMA, LISTAR_TAREAS, LISTAR_NOTAS, BUSCAR_HISTORIAL);

    public static final List<DeepSeekTool> DEFINICIONES = List.of(
            DeepSeekTool.funcion(OBTENER_DIAGRAMA,
                    "Detalle exacto del diagrama: columnas con tipo SQL, PK, FK (tabla referenciada) y nullable, y "
                    + "relaciones con multiplicidad y tipo UML. Úsala antes de proponer cambios sobre tablas existentes.",
                    objeto(Map.of("tabla", texto("Nombre exacto de una tabla. Si se omite, devuelve todas.")),
                            List.of())),
            DeepSeekTool.funcion(LISTAR_TAREAS,
                    "Tareas del tablero Kanban con descripción, prioridad, estado y asignado.",
                    objeto(Map.of(
                            "estado", Map.of("type", "string", "enum", List.of("PENDIENTE", "EN_PROGRESO", "HECHO")),
                            "asignado", texto("username del asignado")), List.of())),
            DeepSeekTool.funcion(LISTAR_NOTAS,
                    "Decisiones de arquitectura (ADR) con su motivo completo, de la más nueva a la más vieja.",
                    objeto(Map.of(
                            "texto", texto("Filtra por texto contenido en la acción o el motivo"),
                            "limite", entero(20)), List.of())),
            DeepSeekTool.funcion(BUSCAR_HISTORIAL,
                    "Busca en TODO el historial del chat del proyecto (full-text en español). Úsala para recordar "
                    + "decisiones o pedidos que no están en MEMORIA ni en HISTORIAL RECIENTE.",
                    objeto(Map.of(
                            "consulta", texto("Palabras clave en español, p.ej. 'borrado lógico cliente'"),
                            "autor", texto("username para filtrar por quién lo dijo"),
                            "limite", entero(10)), List.of("consulta"))));

    private SeniorDevHerramientas() {
    }

    /** Texto que ve la sala en el indicador PENSANDO mientras corre la herramienta. */
    public static String etiqueta(String nombre, Map<String, Object> args) {
        return switch (nombre) {
            case OBTENER_DIAGRAMA -> "Revisando el diagrama…";
            case LISTAR_TAREAS -> "Revisando el tablero Kanban…";
            case LISTAR_NOTAS -> "Leyendo las decisiones (ADR)…";
            case BUSCAR_HISTORIAL -> "Buscando en el historial: “" + args.getOrDefault("consulta", "") + "”…";
            default -> "Senior Dev está pensando...";
        };
    }

    private static Map<String, Object> objeto(Map<String, Object> propiedades, List<String> requeridos) {
        return Map.of("type", "object", "properties", propiedades, "required", requeridos);
    }

    private static Map<String, Object> texto(String descripcion) {
        return Map.of("type", "string", "description", descripcion);
    }

    private static Map<String, Object> entero(int maximo) {
        return Map.of("type", "integer", "minimum", 1, "maximum", maximo);
    }
}
