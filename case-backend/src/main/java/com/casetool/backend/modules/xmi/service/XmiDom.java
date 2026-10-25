package com.casetool.backend.modules.xmi.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/** Utilidades DOM compartidas por la importación XMI: parseo seguro (anti-XXE), detección de
 * dialecto y búsqueda de elementos. No tocan la base de datos. */
final class XmiDom {

    private XmiDom() {
    }

    /** EA / XMI 1.1 usa `UML:Class`/`UML:AssociationClass`; el dialecto propio (XMI 2.1) usa
     * `packagedElement` con `xmi:type="uml:Class"`. */
    static boolean esDialectoEA(Document doc) {
        return doc.getElementsByTagName("UML:Class").getLength() > 0
                || doc.getElementsByTagName("UML:AssociationClass").getLength() > 0;
    }

    static String textoDeHijo(Element padre, String tag, String porDefecto) {
        NodeList hijos = padre.getElementsByTagName(tag);
        if (hijos.getLength() == 0) return porDefecto;
        String valor = ((Element) hijos.item(0)).getAttribute("value");
        return valor.isEmpty() ? porDefecto : valor;
    }

    static double numeroODefault(String texto, double porDefecto) {
        if (texto == null || texto.isEmpty()) return porDefecto;
        try {
            return Double.parseDouble(texto);
        } catch (NumberFormatException e) {
            return porDefecto;
        }
    }

    static List<Element> elementosPorTipo(Document doc, String tipoXmi) {
        List<Element> resultado = new ArrayList<>();
        NodeList todos = doc.getElementsByTagName("packagedElement");
        for (int i = 0; i < todos.getLength(); i++) {
            Element el = (Element) todos.item(i);
            if (tipoXmi.equals(el.getAttribute("xmi:type"))) {
                resultado.add(el);
            }
        }
        return resultado;
    }

    static List<Element> porEtiqueta(Document doc, String etiqueta) {
        return porEtiqueta(doc.getElementsByTagName(etiqueta));
    }

    static List<Element> porEtiqueta(Element padre, String etiqueta) {
        return porEtiqueta(padre.getElementsByTagName(etiqueta));
    }

    private static List<Element> porEtiqueta(NodeList nodos) {
        List<Element> resultado = new ArrayList<>();
        for (int i = 0; i < nodos.getLength(); i++) {
            resultado.add((Element) nodos.item(i));
        }
        return resultado;
    }

    /** `disallow-doctype-decl` bloquea DOCTYPE por completo — la protección estándar contra XXE
     * (entidades externas, "billion laughs") recomendada por OWASP para cualquier parser XML que
     * reciba un archivo subido por el usuario, que es exactamente este caso. */
    static Document parsear(MultipartFile archivo) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(new ByteArrayInputStream(archivo.getBytes()));
        } catch (SAXException | IOException | ParserConfigurationException e) {
            throw new IllegalArgumentException("El archivo no es un XMI válido: " + e.getMessage());
        }
    }
}
