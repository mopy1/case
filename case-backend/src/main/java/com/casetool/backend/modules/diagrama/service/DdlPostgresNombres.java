package com.casetool.backend.modules.diagrama.service;

import java.util.regex.Pattern;

import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;

/** Reglas de nombres y tipos del DDL (mismo snake_case que el generador Spring Boot del frontend). */
final class DdlPostgresNombres {

    private static final Pattern IDENT_SIMPLE = Pattern.compile("^[a-z_][a-z0-9_]*$");

    private DdlPostgresNombres() {
    }

    /** {@code DetallePedido} → {@code detalle_pedido}; espacios y guiones → "_". */
    static String snake(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return "item";
        }
        return nombre.trim()
                .replaceAll("([a-z])([A-Z])", "$1_$2")
                .replaceAll("[_\\-\\s]+", "_")
                .toLowerCase();
    }

    /** Nombre listo para SQL: comillas dobles solo si no es un identificador simple. */
    static String ident(String nombre) {
        String s = snake(nombre);
        return IDENT_SIMPLE.matcher(s).matches() ? s : "\"" + s.replace("\"", "\"\"") + "\"";
    }

    /** VARCHAR → VARCHAR(255), DECIMAL → NUMERIC(12,2); el resto en mayúsculas y saneado. */
    static String tipo(String tipoSql) {
        String t = tipoSql == null ? "" : tipoSql.trim().toUpperCase();
        if (t.equals("VARCHAR")) return "VARCHAR(255)";
        if (t.equals("DECIMAL")) return "NUMERIC(12,2)";
        t = t.replaceAll("[^A-Z0-9_(), ]", "").trim();
        return t.isEmpty() ? "TEXT" : t;
    }

    /** Notación UML: UNO → 1, CERO_O_MAS → 0..*. */
    static String multiplicidad(RelacionDiagrama.Multiplicidad m) {
        if (m == null) return "1";
        return switch (m) {
            case UNO -> "1";
            case CERO_O_UNO -> "0..1";
            case UNO_O_MAS -> "1..*";
            case CERO_O_MAS -> "0..*";
        };
    }
}
