package com.casetool.backend.modules.copilot.service;

/** Todos los topes del Copilot y de la Guía en un solo lugar (constantes, como SeniorDevLimites). */
public final class CopilotLimites {

    private CopilotLimites() {
    }

    public static final int TEXTO_MAX = 4000;
    public static final int IMAGEN_BASE64_MAX = 2_000_000;

    public static final double ASISTENTE_TEMPERATURA = 0.3;
    public static final int ASISTENTE_MAX_TOKENS = 2000;

    public static final double GUIA_TEMPERATURA = 0.3;
    public static final int GUIA_MAX_TOKENS = 700;
    public static final int GUIA_HISTORIAL_TURNOS = 6;
    public static final int TURNO_MAX_CHARS = 1500;
    /** Una sola ronda de herramientas: las llamadas que pasen este tope reciben "ERROR: límite…". */
    public static final int GUIA_MAX_TOOL_CALLS = 2;

    public static final int MANUAL_RESULTADO_MAX_CHARS = 3000;
    public static final int MANUAL_TOP = 2;

    public static final int CUOTA_POR_MINUTO = 20;
    public static final long CUOTA_VENTANA_MS = 60_000;

    public static String recortar(String texto, int max) {
        if (texto == null) return "";
        return texto.length() <= max ? texto : texto.substring(0, max) + "…";
    }
}
