package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;

/**
 * Primera pasada de cualquier import XMI: crea cada clase como {@code EntidadDiagrama} y arma el mapa
 * {@code id xmi -> entidadId real} que necesitan atributos y relaciones. Las posiciones de EA se escalan
 * con la menor escala uniforme sin solapes ({@link XmiEscalaEA}): conserva la forma y no amontona;
 * sin posiciones, grilla de 4 columnas. Corre dentro de la transacción de {@link XmiImportService}.
 */
@Service
class XmiCreadorEntidades {

    /** Margen superior izquierdo del diagrama importado (la escala está en {@link XmiEscalaEA}). */
    private static final double MARGEN = 80;

    /** Mapa `id xmi -> entidadId real` y qué ids se resolvieron a una entidad YA existente (mismo nombre). */
    record ResultadoEntidades(Map<String, Long> idPorXmiId, Set<String> xmiIdsReutilizados) {
    }

    private final EntidadDiagramaService entidadDiagramaService;

    XmiCreadorEntidades(EntidadDiagramaService entidadDiagramaService) {
        this.entidadDiagramaService = entidadDiagramaService;
    }

    /**
     * Modo FUSIONAR (2026-09-26): si el nombre ya existe en el proyecto se reusa esa entidad tal cual
     * (no se crea otra ni se tocan sus columnas); solo las clases con nombre nuevo se crean.
     */
    ResultadoEntidades crear(Long proyectoId, List<ClaseXmi> clases, boolean posicionesDeLienzo, Long usuarioId,
            Map<String, Long> existentesPorNombre) {
        Map<String, Long> idPorXmiId = new HashMap<>();
        Set<String> reutilizados = new HashSet<>();
        boolean conPosiciones = clases.stream().allMatch(c -> c.x() != null && c.y() != null);
        boolean escalar = conPosiciones && !posicionesDeLienzo;
        double escala = escalar ? XmiEscalaEA.escala(clases.stream().map(c -> new XmiEscalaEA.Caja(c.x(), c.y(),
                XmiEscalaEA.anchoLienzo(), XmiEscalaEA.altoLienzo(c.atributos().size()))).toList(),
                XmiEscalaEA.HUECO_LIENZO_X, XmiEscalaEA.HUECO_LIENZO_Y) : 1;
        double margen = escalar ? MARGEN : 0;
        double minX = escalar ? clases.stream().mapToDouble(ClaseXmi::x).min().orElse(0) : 0;
        double minY = escalar ? clases.stream().mapToDouble(ClaseXmi::y).min().orElse(0) : 0;
        int indice = 0;
        for (ClaseXmi clase : clases) {
            Long existenteId = existentesPorNombre.get(clase.nombre());
            if (existenteId != null) {
                idPorXmiId.put(clase.id(), existenteId);
                reutilizados.add(clase.id());
                continue;
            }
            double posX = conPosiciones ? margen + (clase.x() - minX) * escala : 80 + (indice % 4) * 440;
            double posY = conPosiciones ? margen + (clase.y() - minY) * escala : 80 + (indice / 4) * 300;
            EntidadDiagramaResponse creada = entidadDiagramaService.crear(
                    proyectoId, new EntidadDiagramaRequest(clase.nombre(), posX, posY), usuarioId);
            idPorXmiId.put(clase.id(), creada.id());
            existentesPorNombre.put(clase.nombre(), creada.id());
            indice++;
        }
        return new ResultadoEntidades(idPorXmiId, reutilizados);
    }
}
