package com.casetool.backend.modules.xmi.service.lector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.xmi.service.XmiDom;
import com.casetool.backend.modules.xmi.service.XmiEscalaEA;
import com.casetool.backend.modules.xmi.service.XmiMapeoEA;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AtributoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ExtremoXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.GeneralizacionXmi;

/**
 * XMI 1.1 (namespace `UML:`, ids `xmi.id`): el que exporta Enterprise Architect y el export de esta
 * herramienta. La clase asociación llega de dos formas: `UML:AssociationClass` (export propio) o
 * `UML:Class` + `UML:Association` con el tagged value `associationclass` (EA real). `EARootClass` es
 * un artefacto de EA y se descarta.
 */
@Component
@Order(2)
public class LectorXmiEA11 implements LectorXmi {

    private static final String RAIZ_EA = "EARootClass";

    @Override
    public boolean reconoce(Document doc) {
        return XmiDom.esDialectoEA(doc);
    }

    @Override
    public ModeloXmi leer(Document doc) {
        Map<String, String> tipos = new HashMap<>();
        for (Element t : XmiDom.porEtiqueta(doc, "UML:DataType")) {
            if (t.hasAttribute("name")) tipos.put(t.getAttribute("xmi.id"), t.getAttribute("name"));
        }
        Map<String, double[]> posiciones = posiciones(doc);
        List<ClaseXmi> clases = new ArrayList<>();
        List<AsociacionXmi> asociaciones = new ArrayList<>();
        for (Element c : XmiDom.porEtiqueta(doc, "UML:Class")) {
            if (!RAIZ_EA.equals(c.getAttribute("name"))) clases.add(clase(c, tipos, posiciones));
        }
        for (Element ac : XmiDom.porEtiqueta(doc, "UML:AssociationClass")) {
            clases.add(clase(ac, tipos, posiciones));
            asociacion(ac, ac.getAttribute("xmi.id"), asociaciones);
        }
        for (Element a : XmiDom.porEtiqueta(doc, "UML:Association")) {
            asociacion(a, EaTaggedValues.valor(a, "associationclass"), asociaciones);
        }
        List<GeneralizacionXmi> generalizaciones = new ArrayList<>();
        for (Element g : XmiDom.porEtiqueta(doc, "UML:Generalization")) {
            String[] hp = XmiMapeoEA.extremosGeneralizacion(g);
            generalizaciones.add(new GeneralizacionXmi(hp[0], hp[1]));
        }
        // El export propio no trae `XMI.exporter`. Desde 2026-11-10 escribe en escala EA (tag
        // case_coordenadas); los exports anteriores tenían coordenadas del lienzo tal cual y no se escalan.
        boolean deEA = XmiDom.porEtiqueta(doc, "XMI.exporter").stream()
                .anyMatch(e -> e.getTextContent().contains("Enterprise Architect"));
        boolean escalaEA = deEA || XmiEscalaEA.VALOR_EA.equals(EaTaggedValues.valor(doc.getDocumentElement(), XmiEscalaEA.TAG_COORDENADAS));
        return new ModeloXmi(deEA ? "Enterprise Architect (XMI 1.1)" : "CASE Tool (XMI 1.1)", clases, asociaciones,
                generalizaciones, !escalaEA);
    }

    private ClaseXmi clase(Element c, Map<String, String> tipos, Map<String, double[]> posiciones) {
        List<AtributoXmi> atributos = new ArrayList<>();
        for (Element a : XmiDom.porEtiqueta(c, "UML:Attribute")) {
            atributos.add(AtributoXmi.simple(a.getAttribute("name"), XmiMapeoEA.resolverTipoSqlEA(a, tipos)));
        }
        String id = c.getAttribute("xmi.id");
        double[] pos = posiciones.get(id);
        return new ClaseXmi(id, c.getAttribute("name"), atributos, pos != null ? pos[0] : null, pos != null ? pos[1] : null);
    }

    private void asociacion(Element a, String claseAsociacionId, List<AsociacionXmi> destino) {
        List<Element> extremos = XmiDom.porEtiqueta(a, "UML:AssociationEnd");
        if (extremos.size() < 2) return;
        destino.add(new AsociacionXmi(extremo(extremos.get(0)), extremo(extremos.get(1)),
                claseAsociacionId == null || claseAsociacionId.isBlank() ? null : claseAsociacionId));
    }

    private ExtremoXmi extremo(Element e) {
        return new ExtremoXmi(e.getAttribute("type"), e.getAttribute("multiplicity"), e.getAttribute("aggregation"));
    }

    /** `UML:DiagramElement geometry="Left=..;Top=..;"` → esquina superior izquierda por clase. */
    private Map<String, double[]> posiciones(Document doc) {
        Map<String, double[]> res = new HashMap<>();
        for (Element de : XmiDom.porEtiqueta(doc, "UML:DiagramElement")) {
            double[] p = EaTaggedValues.geometria(de.getAttribute("geometry"));
            if (p != null) res.putIfAbsent(de.getAttribute("subject"), p);
        }
        return res;
    }
}
