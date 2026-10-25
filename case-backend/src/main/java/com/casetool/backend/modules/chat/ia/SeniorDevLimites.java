package com.casetool.backend.modules.chat.ia;

/**
 * Todos los topes del contexto y del bucle de herramientas de Senior Dev en un solo lugar
 * (constantes y no @Value: se leen y se defienden más fácil).
 */
public final class SeniorDevLimites {

    // Memoria corta (capa 1)
    public static final int HISTORIAL_MENSAJES = 30;
    public static final int HISTORIAL_CHARS = 600;
    public static final int CONSULTA_MAX_CHARS = 4000;

    // Resumen acumulado (capa 2)
    public static final int RESUMEN_CADA = 20;
    public static final int RESUMEN_LOTE_MAX = 100;
    public static final int RESUMEN_MAX_CHARS = 2000;
    public static final double RESUMEN_TEMPERATURA = 0.2;
    public static final int RESUMEN_MAX_TOKENS = 600;

    // Estado compacto del proyecto (capa 3a)
    public static final int ESTADO_MAX_TABLAS = 40;
    public static final int ESTADO_MAX_TAREAS = 15;
    public static final int ESTADO_MAX_NOTAS = 10;
    public static final int ESTADO_MOTIVO_CHARS = 120;

    // Herramientas (capas 3b y 4)
    public static final int TOOLS_MAX_ITERACIONES = 3;
    public static final int TOOLS_MAX_POR_TURNO = 4;
    public static final int TOOL_RESULTADO_MAX_CHARS = 6000;
    public static final long DEADLINE_MS = 90_000;
    public static final int BUSQUEDA_CONSULTA_MAX_CHARS = 200;
    public static final int BUSQUEDA_LIMITE_DEFAULT = 5;
    public static final int BUSQUEDA_LIMITE_MAX = 10;
    public static final int BUSQUEDA_EXTRACTO_CHARS = 300;
    public static final int NOTAS_LIMITE_DEFAULT = 10;
    public static final int NOTAS_LIMITE_MAX = 20;

    // Llamada principal a DeepSeek
    public static final int MAX_TOKENS = 1200;
    public static final double TEMPERATURA = 0.5;

    private SeniorDevLimites() {
    }

    /** Recorta a {@code max} caracteres agregando "…" si sobró texto. */
    public static String recortar(String texto, int max) {
        if (texto == null) {
            return "";
        }
        return texto.length() <= max ? texto : texto.substring(0, max - 1) + "…";
    }

    /** Lleva {@code valor} al rango [min, max]; null → {@code porDefecto}. */
    public static int acotar(Integer valor, int porDefecto, int min, int max) {
        return valor == null ? porDefecto : Math.max(min, Math.min(max, valor));
    }
}
