package com.casetool.backend.modules.xmi.service;

import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;

/** Builders DOM del export XMI 1.1 para relaciones: `UML:Association` (con sus 2
 * `UML:AssociationEnd`) y `UML:Generalization` (herencia). */
final class XmiRelacionesUml {

    private XmiRelacionesUml() {
    }

    /** Inserta el `UML:Association.connection` (2 `AssociationEnd`) — se usa tanto para el
     * `UML:AssociationClass` de una tabla intermedia como para un `UML:Association` suelto. */
    static void insertarConexion(
            Document doc, Element contenedor, String claseOrigenId, Multiplicidad multOrigen, String claseDestinoId, Multiplicidad multDestino) {
        Element conexion = doc.createElement("UML:Association.connection");
        conexion.appendChild(construirExtremo(doc, "extremo_" + contenedor.getAttribute("xmi.id") + "_o", claseOrigenId, multOrigen, "none"));
        conexion.appendChild(construirExtremo(doc, "extremo_" + contenedor.getAttribute("xmi.id") + "_d", claseDestinoId, multDestino, "none"));
        // El connection va antes que Classifier.feature en el archivo de referencia — si la clase
        // ya tiene atributos cargados, insertar antes de ellos en vez de al final.
        Element feature = primerHijo(contenedor, "UML:Classifier.feature");
        if (feature != null) {
            contenedor.insertBefore(conexion, feature);
        } else {
            contenedor.appendChild(conexion);
        }
    }

    private static Element primerHijo(Element padre, String tag) {
        var hijos = padre.getElementsByTagName(tag);
        return hijos.getLength() == 0 ? null : (Element) hijos.item(0);
    }

    static Element construirRelacion(Document doc, RelacionDiagramaResponse relacion, Map<Long, String> idPorEntidad) {
        if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.HERENCIA) {
            Element gen = doc.createElement("UML:Generalization");
            gen.setAttribute("xmi.id", "gen_" + relacion.id());
            gen.setAttribute("child", idPorEntidad.get(relacion.entidadOrigenId()));
            gen.setAttribute("parent", idPorEntidad.get(relacion.entidadDestinoId()));
            gen.setAttribute("visibility", "public");
            return gen;
        }

        Element assoc = doc.createElement("UML:Association");
        String assocId = "assoc_" + relacion.id();
        assoc.setAttribute("xmi.id", assocId);
        assoc.setAttribute("name", "");
        assoc.setAttribute("visibility", "public");
        assoc.setAttribute("isRoot", "false");
        assoc.setAttribute("isLeaf", "false");
        assoc.setAttribute("isAbstract", "false");

        // Este archivo es XMI 1.1 / UML 1.4 (UML:AssociationEnd, UML:Generalization con
        // child/parent) — su enumeración AggregationKind es {none, aggregate, composite}, NO la
        // de UML 2.x ({none, shared, composite}). "shared" no es un valor válido acá: Enterprise
        // Architect lo ignora silenciosamente y la relación se importa como asociación simple sin
        // rombo. El valor correcto para agregación en este dialecto es "aggregate".
        String aggOrigen = "none";
        if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.COMPOSICION) {
            aggOrigen = "composite";
        } else if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.AGREGACION) {
            aggOrigen = "aggregate";
        }

        Element conexion = doc.createElement("UML:Association.connection");
        conexion.appendChild(construirExtremo(
                doc, assocId + "_o", idPorEntidad.get(relacion.entidadOrigenId()), relacion.multiplicidadOrigen(), aggOrigen));
        conexion.appendChild(construirExtremo(
                doc, assocId + "_d", idPorEntidad.get(relacion.entidadDestinoId()), relacion.multiplicidadDestino(), "none"));
        assoc.appendChild(conexion);
        return assoc;
    }

    private static Element construirExtremo(Document doc, String id, String claseId, Multiplicidad multiplicidad, String aggregation) {
        Element extremo = doc.createElement("UML:AssociationEnd");
        extremo.setAttribute("xmi.id", id);
        extremo.setAttribute("name", "");
        extremo.setAttribute("visibility", "public");
        extremo.setAttribute("isNavigable", "false");
        extremo.setAttribute("ordering", "unordered");
        extremo.setAttribute("aggregation", aggregation);
        extremo.setAttribute("targetScope", "instance");
        extremo.setAttribute("changeable", "none");
        extremo.setAttribute("multiplicity", multiplicidadATexto(multiplicidad));
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
