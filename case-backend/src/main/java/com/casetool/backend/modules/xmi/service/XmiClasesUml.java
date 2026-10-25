package com.casetool.backend.modules.xmi.service;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/** Builders DOM del export XMI 1.1: cabecera del archivo, `UML:Class`/`UML:AssociationClass`
 * y sus `UML:Attribute`. Solo arman elementos, no tocan la base de datos. */
final class XmiClasesUml {

    private XmiClasesUml() {
    }

    static Element construirCabecera(Document doc) {
        Element header = doc.createElement("XMI.header");
        Element documentacion = doc.createElement("XMI.documentation");
        Element exportador = doc.createElement("XMI.exporter");
        exportador.setTextContent("CASE Tool");
        Element version = doc.createElement("XMI.exporterVersion");
        version.setTextContent("1.0");
        documentacion.appendChild(exportador);
        documentacion.appendChild(version);
        header.appendChild(documentacion);
        Element metamodelo = doc.createElement("XMI.metamodel");
        metamodelo.setAttribute("xmi.name", "UML");
        metamodelo.setAttribute("xmi.version", "1.3");
        header.appendChild(metamodelo);
        return header;
    }

    static Element construirClase(
            Document doc, EntidadDiagramaResponse entidad, String claseId, String estereotipo) {
        Element clase = doc.createElement("intermedia".equals(estereotipo) ? "UML:AssociationClass" : "UML:Class");
        clase.setAttribute("xmi.id", claseId);
        clase.setAttribute("name", entidad.nombre());
        clase.setAttribute("visibility", "public");
        clase.setAttribute("isRoot", "false");
        clase.setAttribute("isLeaf", "false");
        clase.setAttribute("isAbstract", "false");
        clase.setAttribute("isActive", "false");

        Element estereotipoEl = doc.createElement("UML:ModelElement.stereotype");
        Element stereotype = doc.createElement("UML:Stereotype");
        stereotype.setAttribute("name", estereotipo);
        estereotipoEl.appendChild(stereotype);
        clase.appendChild(estereotipoEl);

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
