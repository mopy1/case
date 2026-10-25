package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.xmi.service.XmiCreadorEntidades.ResultadoEntidades;

/** Import del dialecto propio (XMI 2.1: `packagedElement xmi:type="uml:Class"`,
 * `ownedAttribute`, `uml:Association`) que generaba versiones viejas de esta herramienta.
 * Corre dentro de la transacción de {@link XmiImportService}. */
@Service
class XmiImportPropio {

    private final XmiCreadorEntidades creadorEntidades;
    private final AtributoEntidadService atributoEntidadService;
    private final RelacionDiagramaService relacionDiagramaService;

    XmiImportPropio(XmiCreadorEntidades creadorEntidades, AtributoEntidadService atributoEntidadService,
            RelacionDiagramaService relacionDiagramaService) {
        this.creadorEntidades = creadorEntidades;
        this.atributoEntidadService = atributoEntidadService;
        this.relacionDiagramaService = relacionDiagramaService;
    }

    /**
     * Tres pasadas, en este orden estricto — un atributo FK o una relación pueden apuntar a una
     * clase que aparece MÁS ADELANTE en el archivo, así que todas las entidades tienen que existir
     * antes de tocar atributos, y todos los atributos antes de las relaciones:
     * <ol>
     *   <li>Crear cada {@code uml:Class} como {@code EntidadDiagrama} (ver
     *       {@link XmiCreadorEntidades}) — arma el mapa {@code xmi:id -> entidadId real}.</li>
     *   <li>Crear los {@code ownedAttribute} de cada clase.</li>
     *   <li>Crear cada {@code uml:Association} como {@code RelacionDiagrama}, vía
     *       {@link RelacionDiagramaService#crearSinTablaIntermedia} — el archivo ya trae la tabla
     *       intermedia de cualquier N:M como una clase más, no hay que regenerarla.</li>
     * </ol>
     */
    void importar(Long proyectoId, Document doc, Long usuarioId, Map<String, Long> existentesPorNombre) {
        List<Element> tiposPrimitivos = XmiDom.elementosPorTipo(doc, "uml:PrimitiveType");
        Map<String, String> tipoSqlPorId = new HashMap<>();
        for (Element tipo : tiposPrimitivos) {
            tipoSqlPorId.put(tipo.getAttribute("xmi:id"), tipo.getAttribute("name"));
        }

        List<Element> clases = XmiDom.elementosPorTipo(doc, "uml:Class");
        ResultadoEntidades resultado = creadorEntidades.crear(proyectoId, clases, usuarioId, existentesPorNombre, "xmi:id");
        crearAtributos(clases, tipoSqlPorId, resultado, usuarioId);

        List<Element> asociaciones = XmiDom.elementosPorTipo(doc, "uml:Association");
        crearRelaciones(proyectoId, asociaciones, resultado.idPorXmiId(), usuarioId);
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
                boolean nullable = "0".equals(XmiDom.textoDeHijo(attrEl, "lowerValue", "1"));

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
        boolean minimoUno = "1".equals(XmiDom.textoDeHijo(extremo, "lowerValue", "1"));
        String superior = XmiDom.textoDeHijo(extremo, "upperValue", "1");
        boolean maximoMuchos = "*".equals(superior) || "-1".equals(superior);
        if (minimoUno) {
            return maximoMuchos ? Multiplicidad.UNO_O_MAS : Multiplicidad.UNO;
        }
        return maximoMuchos ? Multiplicidad.CERO_O_MAS : Multiplicidad.CERO_O_UNO;
    }
}
