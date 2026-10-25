package com.casetool.backend.modules.xmi.service;

import java.io.StringWriter;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/**
 * Genera un `.xmi` en el mismo dialecto que lee {@link XmiImportEA} (XMI 1.1 estilo Enterprise
 * Architect: `UML:Class`/`UML:Attribute`/`UML:Association`/`UML:AssociationClass`, ids con punto).
 * El XMI 2.1 propio de versiones viejas sigue soportado solo para IMPORTAR.
 *
 * <p>"Simple": sin `UML:Package` (todo plano en un `UML:Namespace.ownedElement`) y sin atributos
 * fuera del estándar (nada de namespace `case:`) — se pierde qué atributo puntual es FK, a cambio
 * de un archivo que EA entiende tal cual. Las posiciones del lienzo viajan en el `UML:Diagram`
 * (ver {@link XmiDiagramaUml}).
 *
 * <p>Cada N:M con tabla intermedia (ver {@link XmiAsociacionesClase#detectar}) se exporta como un
 * solo {@code UML:AssociationClass}, en vez de los 3 renglones sueltos del modelo interno (N:M
 * abstracta + entidad + 2 relaciones físicas 1:N) — es como EA representa esto.
 */
@Service
@Transactional(readOnly = true)
public class XmiExportService {

    private final DiagramaService diagramaService;
    private final ProyectoRepository proyectoRepository;

    public XmiExportService(DiagramaService diagramaService, ProyectoRepository proyectoRepository) {
        this.diagramaService = diagramaService;
        this.proyectoRepository = proyectoRepository;
    }

    public String exportar(Long proyectoId, Long usuarioId) {
        DiagramaResponse diagrama = diagramaService.obtenerDiagrama(proyectoId, usuarioId);
        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResourceNotFoundException("Proyecto no encontrado"));
        try {
            return construir(proyecto.getNombre(), diagrama);
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el archivo XMI", e);
        }
    }

    private String construir(String nombreProyecto, DiagramaResponse diagrama) throws Exception {
        List<XmiAsociacionesClase.AsociacionClase> asociaciones = XmiAsociacionesClase.detectar(diagrama);
        Set<Long> idsJunction = asociaciones.stream().map(a -> a.junction().id()).collect(Collectors.toSet());
        Set<Long> idsRelacionesConsumidas = asociaciones.stream()
                .flatMap(a -> Stream.of(a.mn().id(), a.relOrigen().id(), a.relDestino().id()))
                .collect(Collectors.toSet());

        DocumentBuilder builder = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        Document doc = builder.newDocument();

        Element raiz = doc.createElement("XMI");
        raiz.setAttribute("xmi.version", "1.1");
        raiz.setAttribute("xmlns:UML", "omg.org/UML1.3");
        raiz.setAttribute("timestamp", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault()).format(Instant.now()));
        doc.appendChild(raiz);
        raiz.appendChild(XmiClasesUml.construirCabecera(doc));

        Element contenido = doc.createElement("XMI.content");
        raiz.appendChild(contenido);

        Element modelo = doc.createElement("UML:Model");
        modelo.setAttribute("xmi.id", "EAID_model");
        modelo.setAttribute("name", nombreProyecto);
        modelo.setAttribute("isRoot", "false");
        modelo.setAttribute("isLeaf", "false");
        modelo.setAttribute("isAbstract", "false");
        contenido.appendChild(modelo);

        Element namespace = doc.createElement("UML:Namespace.ownedElement");
        modelo.appendChild(namespace);

        Map<Long, String> idPorEntidad = idsDeEntidades(diagrama);

        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            if (idsJunction.contains(entidad.id())) continue;
            namespace.appendChild(XmiClasesUml.construirClase(doc, entidad, idPorEntidad.get(entidad.id()), "table"));
        }

        for (XmiAsociacionesClase.AsociacionClase a : asociaciones) {
            Element assocClase = XmiClasesUml.construirClase(doc, a.junction(), idPorEntidad.get(a.junction().id()), "intermedia");
            XmiRelacionesUml.insertarConexion(doc, assocClase, idPorEntidad.get(a.origen().id()), a.mn().multiplicidadOrigen(),
                    idPorEntidad.get(a.destino().id()), a.mn().multiplicidadDestino());
            namespace.appendChild(assocClase);
        }

        for (RelacionDiagramaResponse relacion : diagrama.relaciones()) {
            if (idsRelacionesConsumidas.contains(relacion.id())) continue;
            namespace.appendChild(XmiRelacionesUml.construirRelacion(doc, relacion, idPorEntidad));
        }

        contenido.appendChild(XmiDiagramaUml.construirDiagrama(doc, nombreProyecto, diagrama, idPorEntidad, "EAID_model"));

        return serializar(doc);
    }

    private Map<Long, String> idsDeEntidades(DiagramaResponse diagrama) {
        Map<Long, String> idPorEntidad = new HashMap<>();
        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            idPorEntidad.put(entidad.id(), "cls_" + entidad.id());
        }
        return idPorEntidad;
    }

    private String serializar(Document doc) throws Exception {
        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        transformer.setOutputProperty(OutputKeys.INDENT, "yes");
        transformer.setOutputProperty("{http://xml.apache.org/xslt}indent-amount", "2");
        transformer.setOutputProperty(OutputKeys.ENCODING, "UTF-8");
        StringWriter salida = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(salida));
        return salida.toString();
    }
}
