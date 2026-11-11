package com.casetool.backend.modules.xmi.service;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/** Tipo de un atributo UML (lenguaje de EA: int, String, boolean…) → uno de los tipos SQL que ofrece el
 * diagramador ({@code TIPOS_SQL} de attribute-form-dialog.tsx). Lo desconocido (clases, enums) → VARCHAR. */
final class XmiTiposSql {

    private static final Set<String> PERMITIDOS = Set.of(
            "VARCHAR", "TEXT", "INTEGER", "BIGINT", "BOOLEAN", "DATE", "TIMESTAMP", "DECIMAL", "UUID");

    private static final Map<String, String> EQUIVALENCIAS = Map.ofEntries(
            Map.entry("int", "INTEGER"), Map.entry("integer", "INTEGER"), Map.entry("short", "INTEGER"),
            Map.entry("long", "BIGINT"), Map.entry("bigint", "BIGINT"),
            Map.entry("string", "VARCHAR"), Map.entry("char", "VARCHAR"), Map.entry("varchar", "VARCHAR"),
            Map.entry("text", "TEXT"), Map.entry("boolean", "BOOLEAN"), Map.entry("bool", "BOOLEAN"),
            Map.entry("float", "DECIMAL"), Map.entry("double", "DECIMAL"), Map.entry("decimal", "DECIMAL"),
            Map.entry("bigdecimal", "DECIMAL"), Map.entry("date", "DATE"), Map.entry("localdate", "DATE"),
            Map.entry("datetime", "TIMESTAMP"), Map.entry("localdatetime", "TIMESTAMP"), Map.entry("time", "TIMESTAMP"), Map.entry("numeric", "DECIMAL"));

    private XmiTiposSql() {
    }

    static String mapear(String tipo) {
        if (tipo == null || tipo.isBlank()) return "VARCHAR";
        String limpio = tipo.trim();
        String equivalente = EQUIVALENCIAS.get(limpio.toLowerCase(Locale.ROOT));
        if (equivalente != null) return equivalente;
        String mayus = limpio.toUpperCase(Locale.ROOT).replaceAll("\\(.*", "");
        return PERMITIDOS.contains(mayus) ? mayus : "VARCHAR";
    }
}
