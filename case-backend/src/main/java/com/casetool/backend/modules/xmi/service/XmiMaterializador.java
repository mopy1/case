package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.casetool.backend.modules.xmi.service.XmiCreadorEntidades.ResultadoEntidades;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;

/**
 * Crea un {@link ModeloXmi} (venga del formato que venga) en el proyecto, en orden estricto: entidades,
 * columnas (necesitan todas las entidades para resolver FK) y relaciones (incluye generar las tablas
 * intermedias de las N:M). Corre dentro de la transacción de {@link XmiImportService}.
 */
@Service
class XmiMaterializador {

    private final XmiCreadorEntidades entidades;
    private final XmiAtributosImport atributos;
    private final XmiRelacionesImport relaciones;

    XmiMaterializador(XmiCreadorEntidades entidades, XmiAtributosImport atributos, XmiRelacionesImport relaciones) {
        this.entidades = entidades;
        this.atributos = atributos;
        this.relaciones = relaciones;
    }

    void materializar(Long proyectoId, ModeloXmi modelo, Long usuarioId, Map<String, Long> existentesPorNombre) {
        List<AsociacionXmi> asociaciones = XmiIntermedias.resolver(modelo);
        ResultadoEntidades resultado = entidades.crear(
                proyectoId, modelo.clases(), modelo.posicionesDeLienzo(), usuarioId, existentesPorNombre);

        Map<String, String> nombrePorXmiId = new HashMap<>();
        modelo.clases().forEach(c -> nombrePorXmiId.put(c.id(), c.nombre()));
        Map<String, List<String>> extremosPorClaseAsociacion = new HashMap<>();
        for (AsociacionXmi a : asociaciones) {
            if (a.claseAsociacionId() != null) {
                extremosPorClaseAsociacion.put(a.claseAsociacionId(), List.of(a.origen().claseId(), a.destino().claseId()));
            }
        }
        for (ClaseXmi clase : modelo.clases()) {
            if (resultado.xmiIdsReutilizados().contains(clase.id())) continue;
            atributos.crear(clase, resultado.idPorXmiId().get(clase.id()), resultado.idPorXmiId(), nombrePorXmiId,
                    extremosPorClaseAsociacion.getOrDefault(clase.id(), List.of()), usuarioId);
        }
        relaciones.crear(proyectoId, asociaciones, modelo.generalizaciones(), resultado.idPorXmiId(), usuarioId);
    }

    /** Relaciones que va a crear el import (para la previsualización): las del archivo + las intermedias. */
    static int contarRelaciones(ModeloXmi modelo) {
        return XmiIntermedias.resolver(modelo).size() + modelo.generalizaciones().size();
    }
}
