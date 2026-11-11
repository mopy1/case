package com.casetool.backend.modules.xmi.service;

import java.util.LinkedHashMap;
import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

/** `UML:Model` (`MX_EAID_…`) con un `UML:Package` (`EAPK_…`) adentro, como los arma Enterprise Architect. */
final class XmiPaqueteEA {

    private XmiPaqueteEA() {
    }

    /** @return el `UML:Namespace.ownedElement` del paquete, donde van clases y relaciones. */
    static Element construir(Document doc, Element contenido, String nombre, String semilla, String paqueteId) {
        Element modelo = doc.createElement("UML:Model");
        modelo.setAttribute("name", "EA Model");
        modelo.setAttribute("xmi.id", "MX_" + XmiIdsEA.elemento(semilla + "-modelo"));
        contenido.appendChild(modelo);
        Element nsModelo = doc.createElement("UML:Namespace.ownedElement");
        modelo.appendChild(nsModelo);

        Element paquete = doc.createElement("UML:Package");
        paquete.setAttribute("name", nombre);
        paquete.setAttribute("xmi.id", paqueteId);
        paquete.setAttribute("isRoot", "false");
        paquete.setAttribute("isLeaf", "false");
        paquete.setAttribute("isAbstract", "false");
        paquete.setAttribute("visibility", "public");
        Map<String, String> tags = new LinkedHashMap<>();
        tags.put("version", "1.0");
        tags.put("packageFlags", "isModel=1;VICON=3;CRC=0;");
        tags.put("ea_stype", "Public");
        tags.put("tpos", "0");
        paquete.appendChild(XmiEtiquetasEA.bloque(doc, tags));
        nsModelo.appendChild(paquete);

        Element nsPaquete = doc.createElement("UML:Namespace.ownedElement");
        paquete.appendChild(nsPaquete);
        return nsPaquete;
    }
}
