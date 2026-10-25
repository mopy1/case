package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;

/**
 * Primera pasada de cualquier import XMI (ambos dialectos): crea cada clase del archivo como
 * {@code EntidadDiagrama} y arma el mapa {@code xmi id -> entidadId real} que necesitan las
 * pasadas siguientes (atributos y relaciones). Corre dentro de la transacción de
 * {@link XmiImportService}.
 */
@Service
class XmiCreadorEntidades {

    /** Mapa `xmi:id/xmi.id -> entidadId real` junto con qué xmi ids se resolvieron a una entidad
     * YA existente en el proyecto (mismo nombre) en vez de crearse. */
    record ResultadoEntidades(Map<String, Long> idPorXmiId, Set<String> xmiIdsReutilizados) {
    }

    private final EntidadDiagramaService entidadDiagramaService;

    XmiCreadorEntidades(EntidadDiagramaService entidadDiagramaService) {
        this.entidadDiagramaService = entidadDiagramaService;
    }

    /**
     * Modo FUSIONAR (pedido explícito 2026-09-26): si el nombre de una clase del archivo ya
     * existe como entidad en el proyecto, NO se crea una nueva ni se toca la existente — se reusa
     * su id tal cual, como si fuera la que trae el archivo. Solo las clases con nombre nuevo se
     * crean de verdad. {@code xmiIdsReutilizados} le dice a la pasada de atributos qué clases
     * saltear (los atributos de la entidad ya existente quedan como están).
     *
     * @param atributoXmiId "xmi:id" en el dialecto propio, "xmi.id" en el de Enterprise Architect.
     */
    ResultadoEntidades crear(Long proyectoId, List<Element> clases, Long usuarioId,
            Map<String, Long> existentesPorNombre, String atributoXmiId) {
        Map<String, Long> entidadIdPorXmiId = new HashMap<>();
        Set<String> xmiIdsReutilizados = new HashSet<>();
        int indice = 0;
        for (Element clase : clases) {
            String nombre = clase.getAttribute("name");
            String xmiId = clase.getAttribute(atributoXmiId);
            Long existenteId = existentesPorNombre.get(nombre);
            if (existenteId != null) {
                entidadIdPorXmiId.put(xmiId, existenteId);
                xmiIdsReutilizados.add(xmiId);
                continue;
            }
            // Posición guardada por el dialecto propio (case:posX/posY); si no viene (archivo de EA),
            // grilla de 4 columnas.
            double posX = XmiDom.numeroODefault(clase.getAttribute("case:posX"), 80 + (indice % 4) * 440);
            double posY = XmiDom.numeroODefault(clase.getAttribute("case:posY"), 80 + (indice / 4) * 300);
            EntidadDiagramaResponse creada = entidadDiagramaService.crear(
                    proyectoId, new EntidadDiagramaRequest(nombre, posX, posY), usuarioId);
            entidadIdPorXmiId.put(xmiId, creada.id());
            indice++;
        }
        return new ResultadoEntidades(entidadIdPorXmiId, xmiIdsReutilizados);
    }
}
