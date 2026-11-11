package com.casetool.backend.modules.xmi.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

/**
 * Ids con el formato de Enterprise Architect ({@code EAID_XXXXXXXX_XXXX_XXXX_XXXX_XXXXXXXXXXXX},
 * {@code EAPK_…} para paquetes y DUID de 8 hex en el diagrama). Deterministas a partir de una semilla
 * (proyecto + entidad), así exportar dos veces el mismo proyecto da los mismos ids.
 */
final class XmiIdsEA {

    private XmiIdsEA() {
    }

    static String guid(String semilla) {
        return UUID.nameUUIDFromBytes(semilla.getBytes(StandardCharsets.UTF_8)).toString()
                .toUpperCase(Locale.ROOT).replace('-', '_');
    }

    static String elemento(String semilla) {
        return "EAID_" + guid(semilla);
    }

    static String paquete(String semilla) {
        return "EAPK_" + guid(semilla);
    }

    static String duid(String semilla) {
        return guid(semilla).substring(0, 8);
    }
}
