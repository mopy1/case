package com.casetool.backend.modules.xmi.service.lector;

import org.w3c.dom.Element;

import com.casetool.backend.modules.xmi.service.XmiDom;

/** Lecturas sueltas de metadatos que agrega Enterprise Architect (tagged values y geometrías). */
final class EaTaggedValues {

    private EaTaggedValues() {
    }

    /** Valor del `UML:TaggedValue tag="..."` dentro del elemento, o null. */
    static String valor(Element el, String tag) {
        for (Element tv : XmiDom.porEtiqueta(el, "UML:TaggedValue")) {
            if (tag.equals(tv.getAttribute("tag"))) return tv.getAttribute("value");
        }
        return null;
    }

    /** "Left=565;Top=197;Right=655;Bottom=267;" → {left, top}; null si no tiene Left/Top. */
    static double[] geometria(String geometry) {
        if (geometry == null || geometry.isBlank()) return null;
        Double left = null;
        Double top = null;
        for (String parte : geometry.split(";")) {
            String[] kv = parte.split("=", 2);
            if (kv.length < 2) continue;
            if ("Left".equalsIgnoreCase(kv[0].trim())) left = numero(kv[1]);
            if ("Top".equalsIgnoreCase(kv[0].trim())) top = numero(kv[1]);
        }
        return left != null && top != null ? new double[] { left, Math.abs(top) } : null;
    }

    static Double numero(String texto) {
        try {
            return Double.parseDouble(texto.trim());
        } catch (NumberFormatException | NullPointerException e) {
            return null;
        }
    }

    /** "EAJava_int" / "EAnone_varchar" → "int" / "varchar" (prefijo de lenguaje de EA 2.1). */
    static String tipoSinPrefijo(String idref) {
        if (idref == null) return "";
        int i = idref.indexOf('_');
        return idref.startsWith("EA") && i > 0 && !idref.startsWith("EAID_") ? idref.substring(i + 1) : idref;
    }
}
