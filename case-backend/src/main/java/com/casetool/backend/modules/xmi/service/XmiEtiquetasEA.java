package com.casetool.backend.modules.xmi.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

/**
 * `UML:ModelElement.taggedValue` con las etiquetas que Enterprise Architect escribe en su propio XMI 1.1
 * (y que lee al importar para ubicar cada elemento en su paquete y en el diagrama).
 */
final class XmiEtiquetasEA {

    private XmiEtiquetasEA() {
    }

    static Element bloque(Document doc, Map<String, String> etiquetas) {
        Element tagged = doc.createElement("UML:ModelElement.taggedValue");
        etiquetas.forEach((tag, valor) -> {
            Element tv = doc.createElement("UML:TaggedValue");
            tv.setAttribute("tag", tag);
            tv.setAttribute("value", valor);
            tagged.appendChild(tv);
        });
        return tagged;
    }

    /** Etiquetas de una clase: tipo EA, paquete dueño y su id local. Van primero, como en EA. */
    static void clase(Document doc, Element clase, String paqueteId, String paqueteNombre, int localId) {
        Map<String, String> t = new LinkedHashMap<>();
        t.put("isSpecification", "false");
        t.put("ea_stype", "Class");
        t.put("ea_ntype", "0");
        t.put("version", "1.0");
        t.put("package", paqueteId);
        t.put("package_name", paqueteNombre);
        t.put("ea_localid", String.valueOf(localId));
        t.put("ea_eleType", "element");
        t.put("style", "BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;");
        clase.setAttribute("namespace", paqueteId);
        clase.insertBefore(bloque(doc, t), clase.getFirstChild());
    }

    /** Etiquetas de un conector: tipo EA, nombres de los extremos y, si la tiene, la clase asociación. */
    static Element conector(Document doc, String tipoEA, String origen, String destino, String claseAsociacionId) {
        Map<String, String> t = new LinkedHashMap<>();
        t.put("style", "3");
        t.put("ea_type", tipoEA);
        t.put("direction", "Unspecified");
        if (claseAsociacionId != null) t.put("subtype", "Class");
        t.put("ea_sourceName", origen);
        t.put("ea_targetName", destino);
        if (claseAsociacionId != null) t.put("associationclass", claseAsociacionId);
        return bloque(doc, t);
    }
}
