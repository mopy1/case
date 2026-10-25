package com.casetool.backend.modules.xmi.service;

import java.util.Map;

import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;

/** Builder DOM del `UML:Diagram` del export XMI: las posiciones de cada tabla en el lienzo. */
final class XmiDiagramaUml {

    private XmiDiagramaUml() {
    }

    /**
     * `UML:Diagram` — pedido explícito (2026-09-25): que el diagrama importado en EA aparezca ya
     * armado con las mismas posiciones del lienzo, no solo las clases sueltas en el árbol del
     * proyecto. Formato verificado (2026-09-25) contra un `.xmi` real exportado desde Enterprise
     * Architect 2.5 (usuario armó 4 clases en un diagrama y lo exportó): es un elemento
     * **hermano de `UML:Model`, dentro de `XMI.content`** — nada de `XMI.extension` aparte, que
     * era la primera versión de esto (adivinada sin archivo de referencia, EA la ignoraba en
     * silencio). `owner` apunta al namespace contenedor de las clases; como este export es
     * "plano" (sin `UML:Package`, ver {@link XmiExportService}), se usa el propio `xmi.id` del
     * `UML:Model` en vez de un paquete inventado.
     *
     * <p>Usa directamente `pos_x`/`pos_y` de cada {@link EntidadDiagramaResponse} (mismo valor
     * que pinta el lienzo React Flow) como esquina superior izquierda (`Left`/`Top`) del
     * rectángulo; ancho fijo y alto proporcional a la cantidad de atributos, ya que EA no guarda
     * el tamaño real que tenía la tabla en nuestro lienzo.
     */
    static Element construirDiagrama(
            Document doc, String nombreProyecto, DiagramaResponse diagrama, Map<Long, String> idPorEntidad, String idModelo) {
        Element diagramaEl = doc.createElement("UML:Diagram");
        diagramaEl.setAttribute("name", nombreProyecto);
        diagramaEl.setAttribute("xmi.id", "dia_diagrama_1");
        diagramaEl.setAttribute("diagramType", "ClassDiagram");
        diagramaEl.setAttribute("owner", idModelo);
        diagramaEl.setAttribute("toolName", "Enterprise Architect 2.5");

        Element taggedValues = doc.createElement("UML:ModelElement.taggedValue");
        taggedValues.appendChild(construirTaggedValue(doc, "type", "Logical"));
        taggedValues.appendChild(construirTaggedValue(doc, "package", idModelo));
        diagramaEl.appendChild(taggedValues);

        Element elementosDiagrama = doc.createElement("UML:Diagram.element");
        int seqno = 1;
        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            String claseId = idPorEntidad.get(entidad.id());
            double left = entidad.posX() != null ? entidad.posX() : 80;
            double top = entidad.posY() != null ? entidad.posY() : 80;
            double ancho = 220;
            double alto = 60 + entidad.atributos().size() * 20;

            Element diagElement = doc.createElement("UML:DiagramElement");
            diagElement.setAttribute("geometry", String.format(
                    "Left=%d;Top=%d;Right=%d;Bottom=%d;",
                    (int) left, (int) top, (int) (left + ancho), (int) (top + alto)));
            diagElement.setAttribute("subject", claseId);
            diagElement.setAttribute("seqno", String.valueOf(seqno++));
            elementosDiagrama.appendChild(diagElement);
        }
        diagramaEl.appendChild(elementosDiagrama);
        return diagramaEl;
    }

    private static Element construirTaggedValue(Document doc, String tag, String value) {
        Element tv = doc.createElement("UML:TaggedValue");
        tv.setAttribute("tag", tag);
        tv.setAttribute("value", value);
        return tv;
    }
}
