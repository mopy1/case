package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/**
 * `UML:Diagram` del export, copiado de la forma en que Enterprise Architect escribe el suyo (hermano de
 * `UML:Model` dentro de `XMI.content`, dueño = el paquete de las clases, cada elemento con su DUID y cada
 * relación como conector del diagrama). Las posiciones del lienzo se pasan a escala EA con la menor escala
 * uniforme sin solapes ({@link XmiEscalaEA}): misma forma que en el lienzo y cajas sin pisarse.
 */
final class XmiDiagramaUml {

    /** Una relación exportada que se dibuja en el diagrama. */
    record ConectorEA(String id, String origenClaseId, String destinoClaseId) {
    }

    private static final double MARGEN_EA = 40;
    private static final String PUNTAS = "SX=0;SY=0;EX=0;EY=0;EDGE=2;$LLB=;LLT=;LMT=;LMB=;LRT=;LRB=;IRHS=;ILHS=;Path=;";

    private XmiDiagramaUml() {
    }

    static Element construirDiagrama(Document doc, String nombre, List<EntidadDiagramaResponse> entidades,
            Map<Long, String> idPorEntidad, String paqueteId, String diagramaId, List<ConectorEA> conectores) {
        Element diagramaEl = doc.createElement("UML:Diagram");
        diagramaEl.setAttribute("name", nombre);
        diagramaEl.setAttribute("xmi.id", diagramaId);
        diagramaEl.setAttribute("diagramType", "ClassDiagram");
        diagramaEl.setAttribute("owner", paqueteId);
        diagramaEl.setAttribute("toolName", "Enterprise Architect 2.5");
        Map<String, String> tags = new LinkedHashMap<>();
        tags.put("version", "1.0");
        tags.put("package", paqueteId);
        tags.put("type", "Logical");
        tags.put("ea_localid", "1");
        tags.put("EAStyle", "ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;"
                + "HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;ShowDetails=0;Orientation=P;Zoom=100;");
        tags.put(XmiEscalaEA.TAG_COORDENADAS, XmiEscalaEA.VALOR_EA);
        diagramaEl.appendChild(XmiEtiquetasEA.bloque(doc, tags));

        Element elementos = doc.createElement("UML:Diagram.element");
        Map<String, String> duidPorClase = new HashMap<>();
        double escala = XmiEscalaEA.escala(entidades.stream().map(e -> new XmiEscalaEA.Caja(x(e), y(e),
                XmiEscalaEA.anchoEA(), XmiEscalaEA.altoEA(e.atributos().size()))).toList(),
                XmiEscalaEA.HUECO_EA_X, XmiEscalaEA.HUECO_EA_Y);
        double minX = entidades.stream().mapToDouble(XmiDiagramaUml::x).min().orElse(0);
        double minY = entidades.stream().mapToDouble(XmiDiagramaUml::y).min().orElse(0);
        int seqno = 1;
        for (EntidadDiagramaResponse entidad : entidades) {
            String claseId = idPorEntidad.get(entidad.id());
            String duid = XmiIdsEA.duid("duid-" + claseId);
            duidPorClase.put(claseId, duid);
            int left = (int) Math.round(MARGEN_EA + (x(entidad) - minX) * escala);
            int top = (int) Math.round(MARGEN_EA + (y(entidad) - minY) * escala);
            int right = left + (int) XmiEscalaEA.anchoEA();
            int bottom = top + (int) XmiEscalaEA.altoEA(entidad.atributos().size());
            Element el = doc.createElement("UML:DiagramElement");
            el.setAttribute("geometry", "Left=" + left + ";Top=" + top + ";Right=" + right + ";Bottom=" + bottom + ";");
            el.setAttribute("subject", claseId);
            el.setAttribute("seqno", String.valueOf(seqno++));
            el.setAttribute("style", "DUID=" + duid + ";");
            elementos.appendChild(el);
        }
        for (ConectorEA c : conectores) {
            Element el = doc.createElement("UML:DiagramElement");
            el.setAttribute("geometry", PUNTAS);
            el.setAttribute("subject", c.id());
            el.setAttribute("style", "Mode=3;EOID=" + duidPorClase.get(c.destinoClaseId()) + ";SOID="
                    + duidPorClase.get(c.origenClaseId()) + ";Color=-1;LWidth=0;Hidden=0;");
            elementos.appendChild(el);
        }
        diagramaEl.appendChild(elementos);
        return diagramaEl;
    }

    private static double x(EntidadDiagramaResponse e) {
        return e.posX() != null ? e.posX() : 80;
    }

    private static double y(EntidadDiagramaResponse e) {
        return e.posY() != null ? e.posY() : 80;
    }
}
