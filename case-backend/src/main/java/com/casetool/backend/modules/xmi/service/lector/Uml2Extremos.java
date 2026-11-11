package com.casetool.backend.modules.xmi.service.lector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.xmi.service.XmiDom;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ExtremoXmi;

/**
 * Resuelve tipos y extremos de asociación en XMI 2.x. El tipo puede venir como atributo `type`
 * (dialecto propio, apunta a un `uml:PrimitiveType`) o como hijo `<type xmi:idref="EAJava_int"/>` (EA).
 * Los extremos son `ownedEnd` (o `ownedAttribute` con `association`) referenciados por `memberEnd`;
 * EA los escribe destino primero (`EAID_dst…`, `EAID_src…`), así que se reordenan origen → destino.
 */
final class Uml2Extremos {

    private final Map<String, String> primitivos = new HashMap<>();
    private final Map<String, Element> extremoPorId = new HashMap<>();

    Uml2Extremos(Document doc) {
        for (Element t : XmiDom.elementosPorTipo(doc, "uml:PrimitiveType")) {
            primitivos.put(t.getAttribute("xmi:id"), t.getAttribute("name"));
        }
        for (String etiqueta : new String[] { "ownedEnd", "ownedAttribute" }) {
            for (Element e : XmiDom.porEtiqueta(doc, etiqueta)) {
                if (!e.getAttribute("association").isBlank()) extremoPorId.put(e.getAttribute("xmi:id"), e);
            }
        }
    }

    String tipo(Element el) {
        String ref = referencia(el);
        if (ref.isBlank()) return "VARCHAR";
        return primitivos.getOrDefault(ref, EaTaggedValues.tipoSinPrefijo(ref));
    }

    Optional<AsociacionXmi> asociacion(Element assoc, String claseAsociacionId) {
        List<Element> ends = new ArrayList<>();
        for (Element m : XmiDom.porEtiqueta(assoc, "memberEnd")) {
            Element e = extremoPorId.get(m.getAttribute("xmi:idref"));
            if (e != null) ends.add(e);
        }
        if (ends.size() < 2) ends = XmiDom.porEtiqueta(assoc, "ownedEnd");
        if (ends.size() < 2) return Optional.empty();
        Element primero = ends.get(0);
        Element segundo = ends.get(1);
        if (primero.getAttribute("xmi:id").contains("_dst") && segundo.getAttribute("xmi:id").contains("_src")) {
            Element tmp = primero;
            primero = segundo;
            segundo = tmp;
        }
        return Optional.of(new AsociacionXmi(extremo(primero), extremo(segundo), claseAsociacionId));
    }

    private ExtremoXmi extremo(Element e) {
        return new ExtremoXmi(referencia(e), multiplicidad(e), e.getAttribute("aggregation"));
    }

    /** "lower..upper" con los valores de `lowerValue`/`upperValue` ("" si no trae ninguno). */
    private static String multiplicidad(Element e) {
        String inferior = XmiDom.textoDeHijo(e, "lowerValue", "");
        String superior = XmiDom.textoDeHijo(e, "upperValue", "");
        if (inferior.isEmpty() && superior.isEmpty()) return "";
        if (superior.isEmpty()) return inferior;
        return (inferior.isEmpty() ? "0" : inferior) + ".." + superior;
    }

    private static String referencia(Element el) {
        if (!el.getAttribute("type").isBlank()) return el.getAttribute("type");
        List<Element> tipos = XmiDom.porEtiqueta(el, "type");
        return tipos.isEmpty() ? "" : tipos.get(0).getAttribute("xmi:idref");
    }
}
