package com.casetool.backend.modules.xmi.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.xmi.dto.ModoImportacionXmi;
import com.casetool.backend.modules.xmi.dto.XmiPreviewResponse;

/**
 * Lee un `.xmi` y recrea entidades, atributos y relaciones en un proyecto, reusando los services
 * normales del módulo `diagrama` (misma validación de nombres duplicados, mismos chequeos de
 * permiso, que crear todo a mano desde el lienzo). Reconoce **dos dialectos** distintos, detectado
 * por la forma del documento — {@link #importar} elige uno u otro, no hace falta que el usuario
 * indique cuál es:
 *
 * <ol>
 *   <li><b>Propio</b> (XMI 2.1, `uml:Class`/`ownedAttribute`/`uml:Association`) — el que genera
 *       {@link XmiExportService}. Ver {@link #importarPropio}.</li>
 *   <li><b>Enterprise Architect / DBML→XMI 1.1</b> (`UML:Class`/`UML:Attribute`/
 *       `UML:Association`/`UML:AssociationClass`, ids con punto — `xmi.id`, no `xmi:id`) —
 *       encontrado real al importar un modelo hecho en Enterprise Architect de otro proyecto
 *       (2026-09-20, pedido explícito: "hay un xmi quiero que sea ese modelo"). Ver
 *       {@link #importarDialectoEA}.</li>
 * </ol>
 */
@Service
@Transactional
public class XmiImportService {

    private final EntidadDiagramaService entidadDiagramaService;
    private final AtributoEntidadService atributoEntidadService;
    private final RelacionDiagramaService relacionDiagramaService;
    private final DiagramaService diagramaService;
    private final ProyectoAccesoService accesoService;

    public XmiImportService(
            EntidadDiagramaService entidadDiagramaService,
            AtributoEntidadService atributoEntidadService,
            RelacionDiagramaService relacionDiagramaService,
            DiagramaService diagramaService,
            ProyectoAccesoService accesoService) {
        this.accesoService = accesoService;
        this.entidadDiagramaService = entidadDiagramaService;
        this.atributoEntidadService = atributoEntidadService;
        this.relacionDiagramaService = relacionDiagramaService;
        this.diagramaService = diagramaService;
    }

    /**
     * Importar exige rol ADMIN — pedido explícito del profesor (2026-09-26): si cualquier
     * `COLABORADOR` pudiera meter un diagrama de Enterprise Architect al lienzo compartido,
     * varios importando a la vez chocarían nombres de tabla entre sí. Antes alcanzaba con
     * `COLABORADOR` (mismo nivel que crear una entidad a mano); ahora solo el ADMIN, que es quien
     * tiene la vista completa del proyecto, decide qué entra.
     */
    public DiagramaResponse importar(Long proyectoId, MultipartFile archivo, Long usuarioId, ModoImportacionXmi modo) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        if (modo == ModoImportacionXmi.REEMPLAZAR) {
            entidadDiagramaService.eliminarTodo(proyectoId);
        }

        Document doc = parsear(archivo);
        boolean esDialectoEA = doc.getElementsByTagName("UML:Class").getLength() > 0
                || doc.getElementsByTagName("UML:AssociationClass").getLength() > 0;
        return esDialectoEA
                ? importarDialectoEA(proyectoId, doc, usuarioId)
                : importarPropio(proyectoId, doc, usuarioId);
    }

    /**
     * Previsualización de solo lectura — no crea nada, se llama antes de {@link #importar} para
     * que el ADMIN vea qué va a pasar (qué tablas trae el archivo, cuáles ya existen en el
     * proyecto — esas se van a reusar tal cual, ver {@link #importar}, no a duplicarse ni a
     * fallar — y cuántas relaciones trae) y recién ahí confirme modo y disparo real. También
     * exige ADMIN — mismo motivo que {@link #importar}, no tiene sentido dejarle previsualizar a
     * alguien que después no puede confirmar.
     */
    public XmiPreviewResponse previsualizar(Long proyectoId, MultipartFile archivo, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        Document doc = parsear(archivo);
        boolean esDialectoEA = doc.getElementsByTagName("UML:Class").getLength() > 0
                || doc.getElementsByTagName("UML:AssociationClass").getLength() > 0;

        List<String> tablas;
        int totalRelaciones;
        if (esDialectoEA) {
            List<Element> clases = new ArrayList<>(porEtiqueta(doc, "UML:Class"));
            clases.addAll(porEtiqueta(doc, "UML:AssociationClass"));
            tablas = clases.stream().map(c -> c.getAttribute("name")).toList();
            totalRelaciones = porEtiqueta(doc, "UML:Association").size() + porEtiqueta(doc, "UML:Generalization").size();
        } else {
            List<Element> clases = elementosPorTipo(doc, "uml:Class");
            tablas = clases.stream().map(c -> c.getAttribute("name")).toList();
            totalRelaciones = elementosPorTipo(doc, "uml:Association").size();
        }

        Map<String, Long> existentesPorNombre = entidadesExistentesPorNombre(proyectoId, usuarioId);
        List<String> tablasExistentes = tablas.stream().filter(existentesPorNombre::containsKey).toList();

        return new XmiPreviewResponse(
                esDialectoEA ? "Enterprise Architect (XMI 1.1)" : "CASE Tool (XMI 2.1)",
                tablas, tablasExistentes, totalRelaciones, existentesPorNombre.size());
    }

    /** Nombre → id de cada entidad ya presente en el proyecto — usado tanto por la previsualización
     * como por el import en modo FUSIONAR (ver {@link #importarPropio}/{@link #importarDialectoEA})
     * para reusar la existente en vez de duplicarla o fallar. */
    private Map<String, Long> entidadesExistentesPorNombre(Long proyectoId, Long usuarioId) {
        return diagramaService.obtenerDiagrama(proyectoId, usuarioId).entidades().stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::nombre, EntidadDiagramaResponse::id));
    }

    // ─────────────────────────────── Dialecto propio (XMI 2.1) ───────────────────────────────

    /**
     * Tres pasadas, en este orden estricto — un atributo FK o una relación pueden apuntar a una
     * clase que aparece MÁS ADELANTE en el archivo, así que todas las entidades tienen que existir
     * antes de tocar atributos, y todos los atributos antes de las relaciones:
     * <ol>
     *   <li>Crear cada {@code uml:Class} como {@code EntidadDiagrama} — arma el mapa
     *       {@code xmi:id -> entidadId real} que las otras dos pasadas necesitan.</li>
     *   <li>Crear los {@code ownedAttribute} de cada clase.</li>
     *   <li>Crear cada {@code uml:Association} como {@code RelacionDiagrama}, vía
     *       {@link RelacionDiagramaService#crearSinTablaIntermedia} — el archivo ya trae la tabla
     *       intermedia de cualquier N:M como una clase más, no hay que regenerarla.</li>
     * </ol>
     */
    private DiagramaResponse importarPropio(Long proyectoId, Document doc, Long usuarioId) {
        List<Element> tiposPrimitivos = elementosPorTipo(doc, "uml:PrimitiveType");
        Map<String, String> tipoSqlPorId = new HashMap<>();
        for (Element tipo : tiposPrimitivos) {
            tipoSqlPorId.put(tipo.getAttribute("xmi:id"), tipo.getAttribute("name"));
        }

        List<Element> clases = elementosPorTipo(doc, "uml:Class");
        ResultadoEntidades resultado = crearEntidades(
                proyectoId, clases, usuarioId, entidadesExistentesPorNombre(proyectoId, usuarioId));
        crearAtributos(clases, tipoSqlPorId, resultado, usuarioId);

        List<Element> asociaciones = elementosPorTipo(doc, "uml:Association");
        crearRelaciones(proyectoId, asociaciones, resultado.idPorXmiId(), usuarioId);

        return diagramaService.obtenerDiagrama(proyectoId, usuarioId);
    }

    /** Mapa `xmi:id/xmi.id -> entidadId real` junto con qué xmi ids se resolvieron a una entidad
     * YA existente en el proyecto (mismo nombre) en vez de crearse — ver {@link #crearEntidades}. */
    private record ResultadoEntidades(Map<String, Long> idPorXmiId, Set<String> xmiIdsReutilizados) {
    }

    /**
     * Modo FUSIONAR (pedido explícito 2026-09-26): si el nombre de una clase del archivo ya
     * existe como entidad en el proyecto, NO se crea una nueva ni se toca la existente — se reusa
     * su id tal cual, como si fuera la que trae el archivo. Solo las clases con nombre nuevo se
     * crean de verdad. {@code xmiIdsReutilizados} le dice a {@link #crearAtributos} qué clases
     * saltear (los atributos de la entidad ya existente quedan como están).
     */
    private ResultadoEntidades crearEntidades(
            Long proyectoId, List<Element> clases, Long usuarioId, Map<String, Long> existentesPorNombre) {
        Map<String, Long> entidadIdPorXmiId = new HashMap<>();
        Set<String> xmiIdsReutilizados = new HashSet<>();
        int indice = 0;
        for (Element clase : clases) {
            String nombre = clase.getAttribute("name");
            String xmiId = clase.getAttribute("xmi:id");
            Long existenteId = existentesPorNombre.get(nombre);
            if (existenteId != null) {
                entidadIdPorXmiId.put(xmiId, existenteId);
                xmiIdsReutilizados.add(xmiId);
                continue;
            }
            double posX = numeroODefault(clase.getAttribute("case:posX"), 80 + (indice % 4) * 440);
            double posY = numeroODefault(clase.getAttribute("case:posY"), 80 + (indice / 4) * 300);
            EntidadDiagramaResponse creada = entidadDiagramaService.crear(
                    proyectoId, new EntidadDiagramaRequest(nombre, posX, posY), usuarioId);
            entidadIdPorXmiId.put(xmiId, creada.id());
            indice++;
        }
        return new ResultadoEntidades(entidadIdPorXmiId, xmiIdsReutilizados);
    }

    private void crearAtributos(
            List<Element> clases, Map<String, String> tipoSqlPorId, ResultadoEntidades resultado, Long usuarioId) {
        Map<String, Long> entidadIdPorXmiId = resultado.idPorXmiId();
        for (Element clase : clases) {
            String xmiId = clase.getAttribute("xmi:id");
            if (resultado.xmiIdsReutilizados().contains(xmiId)) continue;
            Long entidadId = entidadIdPorXmiId.get(xmiId);
            NodeList atributos = clase.getElementsByTagName("ownedAttribute");
            for (int i = 0; i < atributos.getLength(); i++) {
                Element attrEl = (Element) atributos.item(i);
                String nombre = attrEl.getAttribute("name");
                String tipoSql = tipoSqlPorId.getOrDefault(attrEl.getAttribute("type"), "VARCHAR");
                boolean esPk = Boolean.parseBoolean(attrEl.getAttribute("isID"));
                boolean esFk = Boolean.parseBoolean(attrEl.getAttribute("case:esFk"));
                Long referenciaEntidadId = esFk ? entidadIdPorXmiId.get(attrEl.getAttribute("case:referenciaClase")) : null;
                boolean nullable = "0".equals(textoDeHijo(attrEl, "lowerValue", "1"));

                atributoEntidadService.agregar(
                        entidadId,
                        new AtributoEntidadRequest(nombre, tipoSql, esPk, esFk && referenciaEntidadId != null, referenciaEntidadId, nullable),
                        usuarioId);
            }
        }
    }

    private void crearRelaciones(Long proyectoId, List<Element> asociaciones, Map<String, Long> entidadIdPorXmiId, Long usuarioId) {
        for (Element assoc : asociaciones) {
            NodeList extremos = assoc.getElementsByTagName("ownedEnd");
            if (extremos.getLength() < 2) continue;
            Element extremoOrigen = (Element) extremos.item(0);
            Element extremoDestino = (Element) extremos.item(1);
            Long origenId = entidadIdPorXmiId.get(extremoOrigen.getAttribute("type"));
            Long destinoId = entidadIdPorXmiId.get(extremoDestino.getAttribute("type"));
            if (origenId == null || destinoId == null) continue;

            relacionDiagramaService.crearSinTablaIntermedia(
                    proyectoId,
                    new RelacionDiagramaRequest(
                            origenId, destinoId, interpretarMultiplicidad(extremoOrigen), interpretarMultiplicidad(extremoDestino)),
                    usuarioId);
        }
    }

    private Multiplicidad interpretarMultiplicidad(Element extremo) {
        boolean minimoUno = "1".equals(textoDeHijo(extremo, "lowerValue", "1"));
        String superior = textoDeHijo(extremo, "upperValue", "1");
        boolean maximoMuchos = "*".equals(superior) || "-1".equals(superior);
        if (minimoUno) {
            return maximoMuchos ? Multiplicidad.UNO_O_MAS : Multiplicidad.UNO;
        }
        return maximoMuchos ? Multiplicidad.CERO_O_MAS : Multiplicidad.CERO_O_UNO;
    }

    private String textoDeHijo(Element padre, String tag, String porDefecto) {
        NodeList hijos = padre.getElementsByTagName(tag);
        if (hijos.getLength() == 0) return porDefecto;
        String valor = ((Element) hijos.item(0)).getAttribute("value");
        return valor.isEmpty() ? porDefecto : valor;
    }

    private double numeroODefault(String texto, double porDefecto) {
        if (texto == null || texto.isEmpty()) return porDefecto;
        try {
            return Double.parseDouble(texto);
        } catch (NumberFormatException e) {
            return porDefecto;
        }
    }

    private List<Element> elementosPorTipo(Document doc, String tipoXmi) {
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

    // ────────────────────── Dialecto Enterprise Architect / DBML→XMI 1.1 ──────────────────────

    /**
     * Formato real encontrado (2026-09-20) al querer traer un modelo hecho en Enterprise
     * Architect (o exportado por un conversor DBML→XMI, mismo estilo) — bastante distinto del
     * propio: XMI 1.1 (no 2.1), namespace `UML:` con mayúscula, ids con punto (`xmi.id`/
     * `xmi.idref`, no `xmi:id`), clases agrupadas en `UML:Package` (se ignoran — no tenemos
     * carpetas, todo va plano al proyecto), tipos de dato como `UML:DataType` referenciados desde
     * un `UML:StructuralFeature.type` anidado (no un atributo plano `type=`), y **N:M representado
     * como `UML:AssociationClass`** — un solo elemento que es a la vez una clase (con sus propios
     * atributos) y una asociación (2 `AssociationEnd`), a diferencia de nuestro propio modelo que
     * separa la tabla intermedia (una `Class` más) de sus 2 relaciones físicas 1:N.
     *
     * <p>Esta forma **no trae ninguna marca de PK/FK** (ni `isID`, ni el `case:` propio — es un
     * archivo genuino de otra herramienta). Se completa con dos heurísticas, documentadas acá
     * porque son aproximaciones, no datos reales del archivo:
     * <ul>
     *   <li><b>PK:</b> si la entidad tiene un atributo llamado exactamente "id", ese es el único
     *       PK. Si NO lo tiene (el caso de una tabla intermedia con clave compuesta, ej.
     *       "usuario_roles" con solo `usuario_id`+`rol_id`), son PK todos los atributos que
     *       terminan en "_id".</li>
     *   <li><b>Nullable:</b> `false` para el/los PK, `true` para el resto — no hay forma de saber
     *       más sin esa metadata en el archivo.</li>
     * </ul>
     * <b>`esFk`/`referenciaEntidadId` de un atributo puntual quedan siempre en `false`/`null`</b>
     * a propósito — intentar adivinar a qué clase apunta "categoria_id" por el nombre es
     * demasiado frágil (¿"categoria"? ¿"categorias"? ¿otro nombre completamente distinto?). La
     * relación en sí **sí** se recrea igual de fiel vía `UML:Association`/`UML:AssociationClass`
     * (lo que importa para que el diagrama y el generador de backend funcionen); se pierde
     * solamente el badge cosmético de FK en esa columna puntual.
     *
     * <p>Cuatro pasadas (mismo motivo que el dialecto propio — nada puede referenciar algo que
     * todavía no existe):
     * <ol>
     *   <li>Crear cada `UML:Class` Y `UML:AssociationClass` como `EntidadDiagrama` — ambas son
     *       tablas reales, la segunda además participa de una asociación.</li>
     *   <li>Crear los `UML:Attribute` de cada una (con la heurística de PK de arriba).</li>
     *   <li>Crear cada `UML:Association` (relación simple, ej. FK de "productos" a "categorias")
     *       vía {@code crearSinTablaIntermedia} — nunca dispara la auto-creación, no hace falta
     *       acá (no es N:M).</li>
     *   <li>Crear, por cada `UML:AssociationClass`, LAS TRES relaciones que nuestro propio modelo
     *       espera para una N:M con tabla intermedia (ver `RelacionDiagramaService`): la N:M
     *       abstracta entre las dos clases de los extremos (con la multiplicidad real de cada
     *       `AssociationEnd`), y las 2 físicas 1:N de cada extremo hacia la tabla intermedia
     *       (`UNO`/`UNO_O_MAS`, mismo criterio que usa `crearTablaIntermedia` para las que genera
     *       solo). Con esto, `detectarAsociacionesClase` del frontend reconoce el patrón exacto y
     *       dibuja la línea de "clase de asociación" de siempre, sin que hiciera falta tocar el
     *       frontend para nada.</li>
     * </ol>
     */
    private DiagramaResponse importarDialectoEA(Long proyectoId, Document doc, Long usuarioId) {
        Map<String, String> tipoSqlPorId = new HashMap<>();
        for (Element tipo : porEtiqueta(doc, "UML:DataType")) {
            if (tipo.hasAttribute("name")) {
                tipoSqlPorId.put(tipo.getAttribute("xmi.id"), tipo.getAttribute("name").toUpperCase());
            }
        }

        List<Element> clases = new ArrayList<>(porEtiqueta(doc, "UML:Class"));
        List<Element> asociacionesClase = porEtiqueta(doc, "UML:AssociationClass");
        clases.addAll(asociacionesClase);

        // Modo FUSIONAR (pedido explícito 2026-09-26): una clase cuyo nombre ya existe como
        // entidad en el proyecto se reusa tal cual (mismo id, atributos intactos) en vez de
        // duplicarse o fallar — ver el javadoc de `crearEntidades` (dialecto propio) para el
        // detalle completo, acá es la misma idea aplicada al formato EA.
        Map<String, Long> existentesPorNombre = entidadesExistentesPorNombre(proyectoId, usuarioId);
        Map<String, Long> entidadIdPorXmiId = new HashMap<>();
        Set<String> xmiIdsReutilizados = new HashSet<>();
        int indice = 0;
        for (Element clase : clases) {
            String nombre = clase.getAttribute("name");
            String xmiId = clase.getAttribute("xmi.id");
            Long existenteId = existentesPorNombre.get(nombre);
            if (existenteId != null) {
                entidadIdPorXmiId.put(xmiId, existenteId);
                xmiIdsReutilizados.add(xmiId);
                continue;
            }
            double posX = 80 + (indice % 4) * 440;
            double posY = 80 + (indice / 4) * 300;
            EntidadDiagramaResponse creada = entidadDiagramaService.crear(
                    proyectoId, new EntidadDiagramaRequest(nombre, posX, posY), usuarioId);
            entidadIdPorXmiId.put(xmiId, creada.id());
            indice++;
        }

        for (Element clase : clases) {
            String xmiId = clase.getAttribute("xmi.id");
            if (xmiIdsReutilizados.contains(xmiId)) continue;
            Long entidadId = entidadIdPorXmiId.get(xmiId);
            List<Element> atributos = porEtiqueta(clase, "UML:Attribute");
            boolean tieneIdPropio = atributos.stream().anyMatch(a -> "id".equalsIgnoreCase(a.getAttribute("name")));
            for (Element attrEl : atributos) {
                String nombre = attrEl.getAttribute("name");
                String tipoSql = resolverTipoSqlEA(attrEl, tipoSqlPorId);
                boolean esPk = "id".equalsIgnoreCase(nombre)
                        || (!tieneIdPropio && nombre.toLowerCase().endsWith("_id"));
                atributoEntidadService.agregar(
                        entidadId, new AtributoEntidadRequest(nombre, tipoSql, esPk, false, null, !esPk), usuarioId);
            }
        }

        for (Element assoc : porEtiqueta(doc, "UML:Association")) {
            List<Element> extremos = porEtiqueta(assoc, "UML:AssociationEnd");
            if (extremos.size() < 2) continue;
            Long origenId = entidadIdPorXmiId.get(extremos.get(0).getAttribute("type"));
            Long destinoId = entidadIdPorXmiId.get(extremos.get(1).getAttribute("type"));
            if (origenId == null || destinoId == null) continue;

            String agg0 = extremos.get(0).getAttribute("aggregation");
            String agg1 = extremos.get(1).getAttribute("aggregation");
            RelacionDiagrama.TipoRelacionUml tipo = RelacionDiagrama.TipoRelacionUml.ASOCIACION;
            if ("composite".equalsIgnoreCase(agg0) || "composite".equalsIgnoreCase(agg1)) {
                tipo = RelacionDiagrama.TipoRelacionUml.COMPOSICION;
            } else if ("shared".equalsIgnoreCase(agg0) || "aggregate".equalsIgnoreCase(agg0)
                    || "shared".equalsIgnoreCase(agg1) || "aggregate".equalsIgnoreCase(agg1)) {
                tipo = RelacionDiagrama.TipoRelacionUml.AGREGACION;
            }

            relacionDiagramaService.crearSinTablaIntermedia(
                    proyectoId,
                    new RelacionDiagramaRequest(
                            origenId, destinoId,
                            mapMultiplicidadEA(extremos.get(0).getAttribute("multiplicity")),
                            mapMultiplicidadEA(extremos.get(1).getAttribute("multiplicity")),
                            tipo),
                    usuarioId);
        }

        for (Element gen : porEtiqueta(doc, "UML:Generalization")) {
            String childRef = gen.getAttribute("child");
            String parentRef = gen.getAttribute("parent");
            if ((childRef.isEmpty() || parentRef.isEmpty()) && gen.hasAttribute("subtype") && gen.hasAttribute("supertype")) {
                childRef = gen.getAttribute("subtype");
                parentRef = gen.getAttribute("supertype");
            }
            if (childRef.isEmpty()) {
                var cList = porEtiqueta(gen, "UML:Generalization.child");
                if (!cList.isEmpty() && !porEtiqueta(cList.get(0), "UML:Class").isEmpty()) {
                    childRef = porEtiqueta(cList.get(0), "UML:Class").get(0).getAttribute("xmi.idref");
                }
            }
            if (parentRef.isEmpty()) {
                var pList = porEtiqueta(gen, "UML:Generalization.parent");
                if (!pList.isEmpty() && !porEtiqueta(pList.get(0), "UML:Class").isEmpty()) {
                    parentRef = porEtiqueta(pList.get(0), "UML:Class").get(0).getAttribute("xmi.idref");
                }
            }
            Long hijoId = entidadIdPorXmiId.get(childRef);
            Long padreId = entidadIdPorXmiId.get(parentRef);
            if (hijoId != null && padreId != null) {
                relacionDiagramaService.crearSinTablaIntermedia(
                        proyectoId,
                        new RelacionDiagramaRequest(
                                hijoId, padreId,
                                Multiplicidad.UNO,
                                Multiplicidad.UNO,
                                RelacionDiagrama.TipoRelacionUml.HERENCIA),
                        usuarioId);
            }
        }

        for (Element assocClase : asociacionesClase) {
            Long junctionId = entidadIdPorXmiId.get(assocClase.getAttribute("xmi.id"));
            List<Element> extremos = porEtiqueta(assocClase, "UML:AssociationEnd");
            if (junctionId == null || extremos.size() < 2) continue;
            Long claseAId = entidadIdPorXmiId.get(extremos.get(0).getAttribute("type"));
            Long claseBId = entidadIdPorXmiId.get(extremos.get(1).getAttribute("type"));
            if (claseAId == null || claseBId == null) continue;

            relacionDiagramaService.crearSinTablaIntermedia(
                    proyectoId,
                    new RelacionDiagramaRequest(
                            claseAId, claseBId,
                            mapMultiplicidadEA(extremos.get(0).getAttribute("multiplicity")),
                            mapMultiplicidadEA(extremos.get(1).getAttribute("multiplicity"))),
                    usuarioId);
            relacionDiagramaService.crearSinTablaIntermedia(
                    proyectoId, new RelacionDiagramaRequest(claseAId, junctionId, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
            relacionDiagramaService.crearSinTablaIntermedia(
                    proyectoId, new RelacionDiagramaRequest(claseBId, junctionId, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
        }

        return diagramaService.obtenerDiagrama(proyectoId, usuarioId);
    }

    /** El tipo de un `UML:Attribute` viene anidado (`StructuralFeature.type > DataType`), no
     * como atributo plano — a diferencia del dialecto propio. Dos formas válidas, según quién
     * generó el archivo:
     * <ul>
     *   <li>`xmi.idref` apuntando a un `UML:DataType` compartido colgado del paquete (lo que
     *       exporta un Enterprise Architect real, o lo que exportaba esta misma herramienta antes
     *       del 2026-09-23) — se resuelve contra {@code tipoSqlPorId}.</li>
     *   <li>El propio `UML:DataType` anidado ya trae su `name` (lo que exporta esta herramienta
     *       desde el 2026-09-23 — ver `XmiExportService#construirAtributo` — a propósito para que
     *       el tipo no aparezca como un elemento más del árbol de proyecto en EA) — se lee
     *       directo, sin necesitar el mapa.</li>
     * </ul> */
    private String resolverTipoSqlEA(Element attrEl, Map<String, String> tipoSqlPorId) {
        List<Element> tipos = porEtiqueta(attrEl, "UML:DataType");
        if (tipos.isEmpty()) return "VARCHAR";
        Element tipo = tipos.get(0);
        String porIdref = tipoSqlPorId.get(tipo.getAttribute("xmi.idref"));
        if (porIdref != null) return porIdref;
        String nombreInline = tipo.getAttribute("name");
        return nombreInline.isBlank() ? "VARCHAR" : nombreInline.toUpperCase();
    }

    private Multiplicidad mapMultiplicidadEA(String texto) {
        return switch (texto) {
            case "1" -> Multiplicidad.UNO;
            case "0..1" -> Multiplicidad.CERO_O_UNO;
            case "1..*", "1..n" -> Multiplicidad.UNO_O_MAS;
            default -> Multiplicidad.CERO_O_MAS;
        };
    }

    private List<Element> porEtiqueta(Document doc, String etiqueta) {
        return porEtiqueta(doc.getElementsByTagName(etiqueta));
    }

    private List<Element> porEtiqueta(Element padre, String etiqueta) {
        return porEtiqueta(padre.getElementsByTagName(etiqueta));
    }

    private List<Element> porEtiqueta(NodeList nodos) {
        List<Element> resultado = new ArrayList<>();
        for (int i = 0; i < nodos.getLength(); i++) {
            resultado.add((Element) nodos.item(i));
        }
        return resultado;
    }

    /** `disallow-doctype-decl` bloquea DOCTYPE por completo — la protección estándar contra XXE
     * (entidades externas, "billion laughs") recomendada por OWASP para cualquier parser XML que
     * reciba un archivo subido por el usuario, que es exactamente este caso. */
    private Document parsear(MultipartFile archivo) {
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
