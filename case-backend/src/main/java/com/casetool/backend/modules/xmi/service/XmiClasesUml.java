package com.casetool.backend.modules.xmi.service;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/** Builders DOM del export XMI 1.1: cabecera del archivo, `UML:Class`
 * y sus `UML:Attribute`. Solo arman elementos, no tocan la base de datos. */
final class XmiClasesUml {

    private XmiClasesUml() {
    }

    static Element construirCabecera(Document doc) {
        Element header = doc.createElement("XMI.header");
        Element documentacion = doc.createElement("XMI.documentation");
        Element exportador = doc.createElement("XMI.exporter");
        // EA solo aplica el layout del UML:Diagram a archivos que declara suyos; con otro exportador
        // los importa como XMI genérico y apila todas las clases en el mismo punto.
        exportador.setTextContent("Enterprise Architect");
        Element version = doc.createElement("XMI.exporterVersion");
        version.setTextContent("2.5");
        documentacion.appendChild(exportador);
        documentacion.appendChild(version);
        header.appendChild(documentacion);
        Element metamodelo = doc.createElement("XMI.metamodel");
        metamodelo.setAttribute("xmi.name", "UML");
        metamodelo.setAttribute("xmi.version", "1.3");
        header.appendChild(metamodelo);
        return header;
    }

    /** Clase UML simple, sin estereotipo: igual que las que dibuja el usuario en EA. */
    static Element construirClase(Document doc, EntidadDiagramaResponse entidad, String claseId) {
        Element clase = doc.createElement("UML:Class");
        clase.setAttribute("xmi.id", claseId);
        clase.setAttribute("name", entidad.nombre());
        clase.setAttribute("visibility", "public");
        clase.setAttribute("isRoot", "false");
        clase.setAttribute("isLeaf", "false");
        clase.setAttribute("isAbstract", "false");
        clase.setAttribute("isActive", "false");

        if (!entidad.atributos().isEmpty()) {
            Element feature = doc.createElement("UML:Classifier.feature");
            for (AtributoEntidadResponse atributo : entidad.atributos()) {
                feature.appendChild(construirAtributo(doc, atributo));
            }
            clase.appendChild(feature);
        }
        return clase;
    }

    /** El tipo de cada atributo se declara ANIDADO dentro de su propio
     * `UML:StructuralFeature.type` (no como `xmi.idref` a un `UML:DataType` compartido colgado
     * del paquete) a propósito: un `UML:DataType` que cuelga de `UML:Namespace.ownedElement`
     * aparece como un elemento navegable más en el árbol de Enterprise Architect (ej. «dataType»
     * bigint, «dataType» varchar), mezclado con las tablas reales — justo lo que no se quiere ver
     * ahí. Anidado dentro del atributo, EA sigue mostrando el tipo en el detalle del atributo pero
     * no lo agrega al árbol de proyecto. */
    private static Element construirAtributo(Document doc, AtributoEntidadResponse atributo) {
        Element attrEl = doc.createElement("UML:Attribute");
        attrEl.setAttribute("xmi.id", "attr_" + atributo.id());
        attrEl.setAttribute("name", atributo.nombre());
        attrEl.setAttribute("visibility", "public");
        attrEl.setAttribute("ownerScope", "instance");
        attrEl.setAttribute("targetScope", "instance");

        Element tipoWrapper = doc.createElement("UML:StructuralFeature.type");
        Element tipoEl = doc.createElement("UML:DataType");
        tipoEl.setAttribute("xmi.id", "dt_attr_" + atributo.id());
        tipoEl.setAttribute("name", atributo.tipoSql().toLowerCase());
        tipoEl.setAttribute("visibility", "public");
        tipoEl.setAttribute("isRoot", "false");
        tipoEl.setAttribute("isLeaf", "false");
        tipoEl.setAttribute("isAbstract", "false");
        tipoWrapper.appendChild(tipoEl);
        attrEl.appendChild(tipoWrapper);
        return attrEl;
    }
}
