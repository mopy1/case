package com.casetool.backend.modules.xmi.service.lector;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.xmi.service.XmiDom;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AtributoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.GeneralizacionXmi;

/**
 * XMI 2.x (`packagedElement xmi:type="uml:..."`): el XMI 2.1 de Enterprise Architect y el dialecto
 * propio de versiones viejas de esta herramienta (que además trae `isID`, `case:esFk` y `case:posX`).
 * Extremos y tipos: ver {@link Uml2Extremos}.
 */
@Component
@Order(3)
public class LectorXmiUml2 implements LectorXmi {

    @Override
    public boolean reconoce(Document doc) {
        return doc.getElementsByTagName("packagedElement").getLength() > 0;
    }

    @Override
    public ModeloXmi leer(Document doc) {
        Uml2Extremos extremos = new Uml2Extremos(doc);
        Map<String, double[]> posiciones = posiciones(doc);
        List<ClaseXmi> clases = new ArrayList<>();
        List<AsociacionXmi> asociaciones = new ArrayList<>();
        List<GeneralizacionXmi> generalizaciones = new ArrayList<>();
        for (Element el : XmiDom.porEtiqueta(doc, "packagedElement")) {
            String tipo = el.getAttribute("xmi:type");
            boolean esClaseAsociacion = "uml:AssociationClass".equals(tipo);
            if ("uml:Class".equals(tipo) || esClaseAsociacion) {
                clases.add(clase(el, extremos, posiciones));
                for (Element g : XmiDom.porEtiqueta(el, "generalization")) {
                    generalizaciones.add(new GeneralizacionXmi(el.getAttribute("xmi:id"), g.getAttribute("general")));
                }
            }
            if ("uml:Association".equals(tipo) || esClaseAsociacion) {
                extremos.asociacion(el, esClaseAsociacion ? el.getAttribute("xmi:id") : null).ifPresent(asociaciones::add);
            }
        }
        boolean propio = doc.getDocumentElement().hasAttribute("xmlns:case")
                || !XmiDom.porEtiqueta(doc, "packagedElement").stream().filter(e -> e.hasAttribute("case:posX")).toList().isEmpty();
        return new ModeloXmi(propio ? "CASE Tool (XMI 2.1)" : "Enterprise Architect (XMI 2.1)", clases, asociaciones,
                generalizaciones, propio);
    }

    private ClaseXmi clase(Element el, Uml2Extremos extremos, Map<String, double[]> posiciones) {
        List<AtributoXmi> atributos = new ArrayList<>();
        for (Element a : XmiDom.porEtiqueta(el, "ownedAttribute")) {
            if (!a.getAttribute("association").isBlank()) continue; // extremo de asociación navegable, no columna
            atributos.add(atributo(a, extremos));
        }
        String id = el.getAttribute("xmi:id");
        double[] pos = posiciones.get(id);
        Double x = el.hasAttribute("case:posX") ? EaTaggedValues.numero(el.getAttribute("case:posX")) : pos != null ? pos[0] : null;
        Double y = el.hasAttribute("case:posY") ? EaTaggedValues.numero(el.getAttribute("case:posY")) : pos != null ? pos[1] : null;
        return new ClaseXmi(id, el.getAttribute("name"), atributos, x, y);
    }

    private AtributoXmi atributo(Element a, Uml2Extremos extremos) {
        Boolean esPk = a.hasAttribute("isID") ? Boolean.parseBoolean(a.getAttribute("isID")) : null;
        if (esPk == null) return AtributoXmi.simple(a.getAttribute("name"), extremos.tipo(a));
        String fk = Boolean.parseBoolean(a.getAttribute("case:esFk")) ? a.getAttribute("case:referenciaClase") : null;
        boolean nullable = "0".equals(XmiDom.textoDeHijo(a, "lowerValue", "1"));
        return new AtributoXmi(a.getAttribute("name"), extremos.tipo(a), esPk, fk, nullable);
    }

    /** `xmi:Extension > diagrams > diagram > elements > element geometry subject` (EA 2.1). */
    private Map<String, double[]> posiciones(Document doc) {
        Map<String, double[]> res = new java.util.HashMap<>();
        for (Element e : XmiDom.porEtiqueta(doc, "element")) {
            double[] p = EaTaggedValues.geometria(e.getAttribute("geometry"));
            if (p != null) res.putIfAbsent(e.getAttribute("subject"), p);
        }
        return res;
    }
}
