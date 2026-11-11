package com.casetool.backend.modules.xmi.service;

import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;

/**
 * Builders DOM del export XMI 1.1 para relaciones, con la misma forma que el XMI de Enterprise Architect:
 * `UML:Association` (2 `UML:AssociationEnd` + etiquetas `ea_type`, `ea_sourceName`…) y `UML:Generalization`.
 * Una N:M con tabla intermedia sale como EA la escribe: la intermedia es una `UML:Class` y la asociación
 * A–B lleva la etiqueta `associationclass` apuntando a ella (línea punteada en EA).
 */
final class XmiRelacionesUml {

    private XmiRelacionesUml() {
    }

    static Element construirRelacion(Document doc, RelacionDiagramaResponse relacion, String relacionId,
            Map<Long, String> idPorEntidad, Map<Long, String> nombrePorEntidad) {
        String origenId = idPorEntidad.get(relacion.entidadOrigenId());
        String destinoId = idPorEntidad.get(relacion.entidadDestinoId());
        String origen = nombrePorEntidad.get(relacion.entidadOrigenId());
        String destino = nombrePorEntidad.get(relacion.entidadDestinoId());
        if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.HERENCIA) {
            Element gen = doc.createElement("UML:Generalization");
            gen.setAttribute("xmi.id", relacionId);
            gen.setAttribute("subtype", origenId);
            gen.setAttribute("supertype", destinoId);
            gen.setAttribute("visibility", "public");
            gen.appendChild(XmiEtiquetasEA.conector(doc, "Generalization", origen, destino, null));
            return gen;
        }
        // XMI 1.1 / UML 1.4: AggregationKind es {none, aggregate, composite} ("shared" EA lo ignora).
        String aggOrigen = switch (relacion.tipo()) {
            case COMPOSICION -> "composite";
            case AGREGACION -> "aggregate";
            default -> "none";
        };
        String tipoEA = "none".equals(aggOrigen) ? "Association" : "Aggregation";
        return asociacion(doc, relacionId, tipoEA, null, origenId, origen, relacion.multiplicidadOrigen(), aggOrigen,
                destinoId, destino, relacion.multiplicidadDestino());
    }

    /** N:M A–B cuya tabla intermedia es {@code claseAsociacionId}. */
    static Element construirAsociacionClase(Document doc, String relacionId, String claseAsociacionId,
            String origenId, String origen, Multiplicidad multOrigen, String destinoId, String destino, Multiplicidad multDestino) {
        return asociacion(doc, relacionId, "Association", claseAsociacionId, origenId, origen, multOrigen, "none",
                destinoId, destino, multDestino);
    }

    private static Element asociacion(Document doc, String id, String tipoEA, String claseAsociacionId,
            String origenId, String origen, Multiplicidad multOrigen, String aggOrigen,
            String destinoId, String destino, Multiplicidad multDestino) {
        Element assoc = doc.createElement("UML:Association");
        assoc.setAttribute("xmi.id", id);
        assoc.setAttribute("visibility", "public");
        assoc.setAttribute("isRoot", "false");
        assoc.setAttribute("isLeaf", "false");
        assoc.setAttribute("isAbstract", "false");
        assoc.appendChild(XmiEtiquetasEA.conector(doc, tipoEA, origen, destino, claseAsociacionId));
        Element conexion = doc.createElement("UML:Association.connection");
        conexion.appendChild(extremo(doc, origenId, multOrigen, aggOrigen));
        conexion.appendChild(extremo(doc, destinoId, multDestino, "none"));
        assoc.appendChild(conexion);
        return assoc;
    }

    private static Element extremo(Document doc, String claseId, Multiplicidad multiplicidad, String aggregation) {
        Element extremo = doc.createElement("UML:AssociationEnd");
        extremo.setAttribute("visibility", "public");
        extremo.setAttribute("multiplicity", multiplicidadATexto(multiplicidad));
        extremo.setAttribute("aggregation", aggregation);
        extremo.setAttribute("isOrdered", "false");
        extremo.setAttribute("targetScope", "instance");
        extremo.setAttribute("changeable", "none");
        extremo.setAttribute("isNavigable", "true");
        extremo.setAttribute("type", claseId);
        return extremo;
    }

    private static String multiplicidadATexto(Multiplicidad m) {
        return switch (m) {
            case UNO -> "1";
            case CERO_O_UNO -> "0..1";
            case UNO_O_MAS -> "1..*";
            case CERO_O_MAS -> "0..*";
        };
    }
}
