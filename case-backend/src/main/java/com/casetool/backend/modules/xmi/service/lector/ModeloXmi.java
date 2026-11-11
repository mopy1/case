package com.casetool.backend.modules.xmi.service.lector;

import java.util.List;

/**
 * Modelo neutral de un archivo XMI, igual para los 4 formatos que se aceptan (EA XMI 1.1, EA XMI 2.1,
 * EA Native y el XMI 2.1 propio). Cada {@link LectorXmi} traduce su formato a esto y un único
 * materializador lo crea en el proyecto: así las reglas (tablas intermedias, PK/FK) son las mismas
 * sin importar de dónde vino el archivo. {@code posicionesDeLienzo}: las x/y ya son del lienzo de esta
 * herramienta (dialecto propio) y no se escalan.
 */
public record ModeloXmi(String dialecto, List<ClaseXmi> clases, List<AsociacionXmi> asociaciones,
        List<GeneralizacionXmi> generalizaciones, boolean posicionesDeLienzo) {

    /** Modelo de Enterprise Architect: posiciones en píxeles de EA (se escalan al importar). */
    public ModeloXmi(String dialecto, List<ClaseXmi> clases, List<AsociacionXmi> asociaciones,
            List<GeneralizacionXmi> generalizaciones) {
        this(dialecto, clases, asociaciones, generalizaciones, false);
    }

    /** {@code x}/{@code y}: posición en el diagrama de origen (null si el archivo no la trae). */
    public record ClaseXmi(String id, String nombre, List<AtributoXmi> atributos, Double x, Double y) {
    }

    /**
     * {@code esPk}, {@code fkClaseId} y {@code nullable} en null = el archivo no lo dice (EA nunca lo
     * dice) y se resuelve por heurística de nombres en el materializador.
     */
    public record AtributoXmi(String nombre, String tipo, Boolean esPk, String fkClaseId, Boolean nullable) {
        public static AtributoXmi simple(String nombre, String tipo) {
            return new AtributoXmi(nombre, tipo, null, null, null);
        }
    }

    /** {@code claseAsociacionId}: la clase asociación (línea punteada en EA), o null. */
    public record AsociacionXmi(ExtremoXmi origen, ExtremoXmi destino, String claseAsociacionId) {
    }

    /** {@code multiplicidad} tal cual el archivo ("1", "0..*", "1..", "" si no tiene). */
    public record ExtremoXmi(String claseId, String multiplicidad, String agregacion) {
    }

    public record GeneralizacionXmi(String hijoId, String padreId) {
    }
}
