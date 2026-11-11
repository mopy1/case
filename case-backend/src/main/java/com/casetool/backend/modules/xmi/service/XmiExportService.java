package com.casetool.backend.modules.xmi.service;

import java.io.StringWriter;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
 * Genera un `.xmi` XMI 1.1 con la MISMA forma que el que exporta Enterprise Architect (archivo de referencia:
 * `src/test/resources/xmi/ea-1.1.xmi`): exportador "Enterprise Architect", `UML:Model` → `UML:Package`
 * (`EAPK_…`) → clases con ids `EAID_…` y etiquetas `package`/`ea_localid`, y el `UML:Diagram` como hermano
 * del modelo con dueño = el paquete. Con un exportador ajeno EA importaba el archivo como XMI genérico,
 * ignoraba el layout y apilaba todas las clases en el mismo punto.
 *
 * <p>Cada N:M con tabla intermedia ({@link XmiAsociacionesClase#detectar}) sale como en EA: la intermedia es
 * una `UML:Class` y la asociación A–B lleva la etiqueta `associationclass` (línea punteada). Las 2 relaciones
 * físicas A→J y B→J del modelo interno no se exportan (EA las representa con esa línea).
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
            return serializar(construir(proyectoId, proyecto.getNombre(), diagrama));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo generar el archivo XMI", e);
        }
    }

    private Document construir(Long proyectoId, String nombre, DiagramaResponse diagrama) throws Exception {
        List<XmiAsociacionesClase.AsociacionClase> asociaciones = XmiAsociacionesClase.detectar(diagrama);
        Set<Long> consumidas = asociaciones.stream()
                .flatMap(a -> Stream.of(a.mn().id(), a.relOrigen().id(), a.relDestino().id())).collect(Collectors.toSet());
        String semilla = "proyecto-" + proyectoId;
        String paqueteId = XmiIdsEA.paquete(semilla);
        Map<Long, String> idPorEntidad = new HashMap<>();
        Map<Long, String> nombrePorEntidad = new HashMap<>();
        diagrama.entidades().forEach(e -> {
            idPorEntidad.put(e.id(), XmiIdsEA.elemento(semilla + "-entidad-" + e.id()));
            nombrePorEntidad.put(e.id(), e.nombre());
        });

        Document doc = DocumentBuilderFactory.newInstance().newDocumentBuilder().newDocument();
        Element raiz = doc.createElement("XMI");
        raiz.setAttribute("xmi.version", "1.1");
        raiz.setAttribute("xmlns:UML", "omg.org/UML1.3");
        raiz.setAttribute("timestamp", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault()).format(Instant.now()));
        doc.appendChild(raiz);
        raiz.appendChild(XmiClasesUml.construirCabecera(doc));
        Element contenido = doc.createElement("XMI.content");
        raiz.appendChild(contenido);
        Element clases = XmiPaqueteEA.construir(doc, contenido, nombre, semilla, paqueteId);

        int localId = 1;
        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            Element clase = XmiClasesUml.construirClase(doc, entidad, idPorEntidad.get(entidad.id()));
            XmiEtiquetasEA.clase(doc, clase, paqueteId, nombre, localId++);
            clases.appendChild(clase);
        }
        List<XmiDiagramaUml.ConectorEA> conectores = new ArrayList<>();
        for (XmiAsociacionesClase.AsociacionClase a : asociaciones) {
            String id = XmiIdsEA.elemento(semilla + "-relacion-" + a.mn().id());
            String origenId = idPorEntidad.get(a.origen().id());
            String destinoId = idPorEntidad.get(a.destino().id());
            clases.appendChild(XmiRelacionesUml.construirAsociacionClase(doc, id, idPorEntidad.get(a.junction().id()),
                    origenId, a.origen().nombre(), a.mn().multiplicidadOrigen(),
                    destinoId, a.destino().nombre(), a.mn().multiplicidadDestino()));
            conectores.add(new XmiDiagramaUml.ConectorEA(id, origenId, destinoId));
        }
        for (RelacionDiagramaResponse relacion : diagrama.relaciones()) {
            if (consumidas.contains(relacion.id())) continue;
            String id = XmiIdsEA.elemento(semilla + "-relacion-" + relacion.id());
            clases.appendChild(XmiRelacionesUml.construirRelacion(doc, relacion, id, idPorEntidad, nombrePorEntidad));
            conectores.add(new XmiDiagramaUml.ConectorEA(id, idPorEntidad.get(relacion.entidadOrigenId()),
                    idPorEntidad.get(relacion.entidadDestinoId())));
        }
        contenido.appendChild(XmiDiagramaUml.construirDiagrama(doc, nombre, diagrama.entidades(), idPorEntidad,
                paqueteId, XmiIdsEA.elemento(semilla + "-diagrama"), conectores));
        return doc;
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
