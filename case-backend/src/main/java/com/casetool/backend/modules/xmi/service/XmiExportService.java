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
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

/**
 * Genera un `.xmi` — pedido explícito (2026-09-20): "para exportar sea el mismo formato que el
 * xmi de erp_bolivia... quiero que se vea simple, y con relación intermedia". Mismo dialecto que
 * {@link XmiImportService#importarDialectoEA} sabe leer (XMI 1.1, `UML:Class`/`UML:Attribute`/
 * `UML:Association`/`UML:AssociationClass`, ids con punto) — no el XMI 2.1 propio que se usaba
 * antes (ese sigue soportado solo para IMPORTAR, ver `XmiImportService`, por si alguien trae un
 * archivo así de una sesión vieja).
 *
 * <p>"Simple" = sin `UML:Package` (el archivo de referencia agrupa las clases en carpetas por
 * módulo; acá todo va plano, un solo `UML:Namespace.ownedElement`) y sin ningún atributo propio
 * fuera del estándar (nada de namespace `case:` — se pierde el detalle cosmético de qué atributo
 * puntual es FK y la posición en el lienzo, a cambio de un archivo que se ve exactamente como uno
 * real de Enterprise Architect, sin nada añadido que otra herramienta no entienda).
 *
 * <p>"Con relación intermedia" = cada N:M con tabla intermedia (detectado con la misma
 * heurística que ya usa el frontend, `detectarAsociacionesClase` en `useDiagramCanvas.ts` — ver
 * {@link #detectarAsociacionesClase}) se exporta como **un solo** {@code UML:AssociationClass}
 * (clase + asociación en un solo elemento, con sus propios atributos), en vez de los 3 renglones
 * sueltos que usa el modelo interno (una relación N:M abstracta + una entidad + 2 relaciones
 * físicas 1:N) — es la forma real en que Enterprise Architect representa esto.
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

    // ─────────────────────── Detección de "tabla intermedia de N:M" ───────────────────────
    // Misma heurística que `detectarAsociacionesClase` en useDiagramCanvas.ts del frontend — acá
    // se usa para decidir qué entra como UML:AssociationClass (con sus 3 relaciones colapsadas en
    // una) y qué como UML:Class + UML:Association sueltos.

    private record AsociacionClase(
            EntidadDiagramaResponse origen, EntidadDiagramaResponse destino, EntidadDiagramaResponse junction,
            RelacionDiagramaResponse mn, RelacionDiagramaResponse relOrigen, RelacionDiagramaResponse relDestino) {
    }

    private List<AsociacionClase> detectarAsociacionesClase(DiagramaResponse diagrama) {
        Map<Long, EntidadDiagramaResponse> entidadPorId = diagrama.entidades().stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::id, e -> e));
        List<AsociacionClase> resultado = new ArrayList<>();

        for (RelacionDiagramaResponse mn : diagrama.relaciones()) {
            if (esUno(mn.multiplicidadOrigen()) || esUno(mn.multiplicidadDestino())) continue;

            for (EntidadDiagramaResponse junction : diagrama.entidades()) {
                if (junction.id().equals(mn.entidadOrigenId()) || junction.id().equals(mn.entidadDestinoId())) continue;

                List<RelacionDiagramaResponse> candidatas = diagrama.relaciones().stream()
                        .filter(r -> esFisicaUnoAMuchos(r) && r.entidadDestinoId().equals(junction.id()))
                        .toList();
                RelacionDiagramaResponse relOrigen = candidatas.stream()
                        .filter(r -> r.entidadOrigenId().equals(mn.entidadOrigenId())).findFirst().orElse(null);
                if (relOrigen == null) continue;
                RelacionDiagramaResponse relDestino = candidatas.stream()
                        .filter(r -> r.entidadOrigenId().equals(mn.entidadDestinoId()) && !r.id().equals(relOrigen.id()))
                        .findFirst().orElse(null);
                if (relDestino == null) continue;

                resultado.add(new AsociacionClase(
                        entidadPorId.get(mn.entidadOrigenId()), entidadPorId.get(mn.entidadDestinoId()),
                        junction, mn, relOrigen, relDestino));
                break;
            }
        }
        return resultado;
    }

    private boolean esUno(Multiplicidad m) {
        return m == Multiplicidad.UNO || m == Multiplicidad.CERO_O_UNO;
    }

    private boolean esFisicaUnoAMuchos(RelacionDiagramaResponse r) {
        return r.multiplicidadOrigen() == Multiplicidad.UNO && r.multiplicidadDestino() == Multiplicidad.UNO_O_MAS;
    }

    // ─────────────────────────────────── Construcción del XML ───────────────────────────────────

    private String construir(String nombreProyecto, DiagramaResponse diagrama) throws Exception {
        List<AsociacionClase> asociaciones = detectarAsociacionesClase(diagrama);
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
        raiz.appendChild(construirCabecera(doc));

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
            namespace.appendChild(construirClase(doc, entidad, idPorEntidad.get(entidad.id()), "table"));
        }

        for (AsociacionClase a : asociaciones) {
            Element assocClase = construirClase(doc, a.junction(), idPorEntidad.get(a.junction().id()), "intermedia");
            insertarConexion(doc, assocClase, idPorEntidad.get(a.origen().id()), a.mn().multiplicidadOrigen(),
                    idPorEntidad.get(a.destino().id()), a.mn().multiplicidadDestino());
            namespace.appendChild(assocClase);
        }

        for (RelacionDiagramaResponse relacion : diagrama.relaciones()) {
            if (idsRelacionesConsumidas.contains(relacion.id())) continue;
            namespace.appendChild(construirRelacion(doc, relacion, idPorEntidad));
        }

        contenido.appendChild(construirDiagrama(doc, nombreProyecto, diagrama, idPorEntidad, "EAID_model"));

        return serializar(doc);
    }

    /**
     * `UML:Diagram` — pedido explícito (2026-09-25): que el diagrama importado en EA aparezca ya
     * armado con las mismas posiciones del lienzo, no solo las clases sueltas en el árbol del
     * proyecto. Formato verificado (2026-09-25) contra un `.xmi` real exportado desde Enterprise
     * Architect 2.5 (usuario armó 4 clases en un diagrama y lo exportó): es un elemento
     * **hermano de `UML:Model`, dentro de `XMI.content`** — nada de `XMI.extension` aparte, que
     * era la primera versión de esto (adivinada sin archivo de referencia, EA la ignoraba en
     * silencio). `owner` apunta al namespace contenedor de las clases; como este export es
     * "plano" (sin `UML:Package`, ver {@link #construir}), se usa el propio `xmi.id` del
     * `UML:Model` en vez de un paquete inventado.
     *
     * <p>Usa directamente `pos_x`/`pos_y` de cada {@link EntidadDiagramaResponse} (mismo valor
     * que pinta el lienzo React Flow) como esquina superior izquierda (`Left`/`Top`) del
     * rectángulo; ancho fijo y alto proporcional a la cantidad de atributos, ya que EA no guarda
     * el tamaño real que tenía la tabla en nuestro lienzo.
     */
    private Element construirDiagrama(
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

    private Element construirTaggedValue(Document doc, String tag, String value) {
        Element tv = doc.createElement("UML:TaggedValue");
        tv.setAttribute("tag", tag);
        tv.setAttribute("value", value);
        return tv;
    }

    private Element construirCabecera(Document doc) {
        Element header = doc.createElement("XMI.header");
        Element documentacion = doc.createElement("XMI.documentation");
        Element exportador = doc.createElement("XMI.exporter");
        exportador.setTextContent("CASE Tool");
        Element version = doc.createElement("XMI.exporterVersion");
        version.setTextContent("1.0");
        documentacion.appendChild(exportador);
        documentacion.appendChild(version);
        header.appendChild(documentacion);
        Element metamodelo = doc.createElement("XMI.metamodel");
        metamodelo.setAttribute("xmi.name", "UML");
        metamodelo.setAttribute("xmi.version", "1.3");
        header.appendChild(metamodelo);
        return header;
    }

    private Map<Long, String> idsDeEntidades(DiagramaResponse diagrama) {
        Map<Long, String> idPorEntidad = new HashMap<>();
        for (EntidadDiagramaResponse entidad : diagrama.entidades()) {
            idPorEntidad.put(entidad.id(), "cls_" + entidad.id());
        }
        return idPorEntidad;
    }

    private Element construirClase(
            Document doc, EntidadDiagramaResponse entidad, String claseId, String estereotipo) {
        Element clase = doc.createElement("intermedia".equals(estereotipo) ? "UML:AssociationClass" : "UML:Class");
        clase.setAttribute("xmi.id", claseId);
        clase.setAttribute("name", entidad.nombre());
        clase.setAttribute("visibility", "public");
        clase.setAttribute("isRoot", "false");
        clase.setAttribute("isLeaf", "false");
        clase.setAttribute("isAbstract", "false");
        clase.setAttribute("isActive", "false");

        Element estereotipoEl = doc.createElement("UML:ModelElement.stereotype");
        Element stereotype = doc.createElement("UML:Stereotype");
        stereotype.setAttribute("name", estereotipo);
        estereotipoEl.appendChild(stereotype);
        clase.appendChild(estereotipoEl);

        if (!entidad.atributos().isEmpty()) {
            Element feature = doc.createElement("UML:Classifier.feature");
            for (AtributoEntidadResponse atributo : entidad.atributos()) {
                feature.appendChild(construirAtributo(doc, atributo));
            }
            clase.appendChild(feature);
        }
        return clase;
    }

    /** El tipo de cada atributo se declara ANIDADO dentro de su propio
     * `UML:StructuralFeature.type` (no como `xmi.idref` a un `UML:DataType` compartido colgado
     * del paquete) a propósito: un `UML:DataType` que cuelga de `UML:Namespace.ownedElement`
     * aparece como un elemento navegable más en el árbol de Enterprise Architect (ej. «dataType»
     * bigint, «dataType» varchar), mezclado con las tablas reales — justo lo que no se quiere ver
     * ahí. Anidado dentro del atributo, EA sigue mostrando el tipo en el detalle del atributo pero
     * no lo agrega al árbol de proyecto. */
    private Element construirAtributo(Document doc, AtributoEntidadResponse atributo) {
        Element attrEl = doc.createElement("UML:Attribute");
        attrEl.setAttribute("xmi.id", "attr_" + atributo.id());
        attrEl.setAttribute("name", atributo.nombre());
        attrEl.setAttribute("visibility", "public");
        attrEl.setAttribute("ownerScope", "instance");
        attrEl.setAttribute("targetScope", "instance");

        Element tipoWrapper = doc.createElement("UML:StructuralFeature.type");
        Element tipoEl = doc.createElement("UML:DataType");
        tipoEl.setAttribute("xmi.id", "dt_attr_" + atributo.id());
        tipoEl.setAttribute("name", atributo.tipoSql().toLowerCase());
        tipoEl.setAttribute("visibility", "public");
        tipoEl.setAttribute("isRoot", "false");
        tipoEl.setAttribute("isLeaf", "false");
        tipoEl.setAttribute("isAbstract", "false");
        tipoWrapper.appendChild(tipoEl);
        attrEl.appendChild(tipoWrapper);
        return attrEl;
    }

    /** Inserta el `UML:Association.connection` (2 `AssociationEnd`) — se usa tanto para el
     * `UML:AssociationClass` de una tabla intermedia como para un `UML:Association` suelto. */
    private void insertarConexion(
            Document doc, Element contenedor, String claseOrigenId, Multiplicidad multOrigen, String claseDestinoId, Multiplicidad multDestino) {
        Element conexion = doc.createElement("UML:Association.connection");
        conexion.appendChild(construirExtremo(doc, "extremo_" + contenedor.getAttribute("xmi.id") + "_o", claseOrigenId, multOrigen, "none"));
        conexion.appendChild(construirExtremo(doc, "extremo_" + contenedor.getAttribute("xmi.id") + "_d", claseDestinoId, multDestino, "none"));
        // El connection va antes que Classifier.feature en el archivo de referencia — si la clase
        // ya tiene atributos cargados, insertar antes de ellos en vez de al final.
        Element feature = primerHijo(contenedor, "UML:Classifier.feature");
        if (feature != null) {
            contenedor.insertBefore(conexion, feature);
        } else {
            contenedor.appendChild(conexion);
        }
    }

    private Element primerHijo(Element padre, String tag) {
        var hijos = padre.getElementsByTagName(tag);
        return hijos.getLength() == 0 ? null : (Element) hijos.item(0);
    }

    private Element construirRelacion(Document doc, RelacionDiagramaResponse relacion, Map<Long, String> idPorEntidad) {
        if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.HERENCIA) {
            Element gen = doc.createElement("UML:Generalization");
            gen.setAttribute("xmi.id", "gen_" + relacion.id());
            gen.setAttribute("child", idPorEntidad.get(relacion.entidadOrigenId()));
            gen.setAttribute("parent", idPorEntidad.get(relacion.entidadDestinoId()));
            gen.setAttribute("visibility", "public");
            return gen;
        }

        Element assoc = doc.createElement("UML:Association");
        String assocId = "assoc_" + relacion.id();
        assoc.setAttribute("xmi.id", assocId);
        assoc.setAttribute("name", "");
        assoc.setAttribute("visibility", "public");
        assoc.setAttribute("isRoot", "false");
        assoc.setAttribute("isLeaf", "false");
        assoc.setAttribute("isAbstract", "false");

        // Este archivo es XMI 1.1 / UML 1.4 (UML:AssociationEnd, UML:Generalization con
        // child/parent) — su enumeración AggregationKind es {none, aggregate, composite}, NO la
        // de UML 2.x ({none, shared, composite}). "shared" no es un valor válido acá: Enterprise
        // Architect lo ignora silenciosamente y la relación se importa como asociación simple sin
        // rombo. El valor correcto para agregación en este dialecto es "aggregate".
        String aggOrigen = "none";
        if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.COMPOSICION) {
            aggOrigen = "composite";
        } else if (relacion.tipo() == RelacionDiagrama.TipoRelacionUml.AGREGACION) {
            aggOrigen = "aggregate";
        }

        Element conexion = doc.createElement("UML:Association.connection");
        conexion.appendChild(construirExtremo(
                doc, assocId + "_o", idPorEntidad.get(relacion.entidadOrigenId()), relacion.multiplicidadOrigen(), aggOrigen));
        conexion.appendChild(construirExtremo(
                doc, assocId + "_d", idPorEntidad.get(relacion.entidadDestinoId()), relacion.multiplicidadDestino(), "none"));
        assoc.appendChild(conexion);
        return assoc;
    }

    private Element construirExtremo(Document doc, String id, String claseId, Multiplicidad multiplicidad, String aggregation) {
        Element extremo = doc.createElement("UML:AssociationEnd");
        extremo.setAttribute("xmi.id", id);
        extremo.setAttribute("name", "");
        extremo.setAttribute("visibility", "public");
        extremo.setAttribute("isNavigable", "false");
        extremo.setAttribute("ordering", "unordered");
        extremo.setAttribute("aggregation", aggregation);
        extremo.setAttribute("targetScope", "instance");
        extremo.setAttribute("changeable", "none");
        extremo.setAttribute("multiplicity", multiplicidadATexto(multiplicidad));
        extremo.setAttribute("type", claseId);
        return extremo;
    }

    private String multiplicidadATexto(Multiplicidad m) {
        return switch (m) {
            case UNO -> "1";
            case CERO_O_UNO -> "0..1";
            case UNO_O_MAS -> "1..*";
            case CERO_O_MAS -> "0..*";
        };
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
