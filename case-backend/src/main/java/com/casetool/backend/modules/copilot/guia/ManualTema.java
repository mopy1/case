package com.casetool.backend.modules.copilot.guia;

import java.util.List;

/** Un tema del manual de uso (resources/guia/manual.json). {@code adrSugerida} es opcional. */
public record ManualTema(
    String id,
    String titulo,
    String seccion,
    String resumen,
    String contenido,
    List<String> palabrasClave,
    AdrSugerida adrSugerida
) {
    public record AdrSugerida(String accion, String motivo) {}
}
