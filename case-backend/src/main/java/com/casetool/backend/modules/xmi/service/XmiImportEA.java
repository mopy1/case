package com.casetool.backend.modules.xmi.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.Multiplicidad;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama.TipoRelacionUml;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.xmi.service.XmiCreadorEntidades.ResultadoEntidades;

/**
 * Import del dialecto Enterprise Architect / DBML→XMI 1.1 (el mismo que genera
 * {@link XmiExportService}): namespace `UML:` con mayúscula, ids con punto (`xmi.id`/`xmi.idref`),
 * `UML:Package` ignorados (todo va plano al proyecto), tipos como `UML:DataType` anidados en
 * `UML:StructuralFeature.type`, y N:M representado como `UML:AssociationClass` (clase con
 * atributos + asociación de 2 `AssociationEnd` en un solo elemento).
 *
 * <p>Este formato <b>no trae marcas de PK/FK</b>. Heurísticas (aproximaciones, no datos del archivo):
 * <ul>
 *   <li><b>PK:</b> si la entidad tiene un atributo llamado exactamente "id", ese es el único PK; si
 *       no (tabla intermedia con clave compuesta), son PK todos los que terminan en "_id".</li>
 *   <li><b>Nullable:</b> `false` para los PK, `true` para el resto.</li>
 *   <li><b>esFk/referenciaEntidadId:</b> siempre `false`/`null` — adivinar a qué clase apunta
 *       "categoria_id" por el nombre es demasiado frágil. La relación en sí SÍ se recrea vía
 *       `UML:Association`/`UML:AssociationClass`; solo se pierde el badge de FK de la columna.</li>
 * </ul>
 *
 * <p>Pasadas en orden estricto (nada puede referenciar algo que todavía no existe): entidades
 * (`UML:Class` y `UML:AssociationClass`), atributos, `UML:Association`, `UML:Generalization`
 * (herencia) y, por cada `UML:AssociationClass`, las 3 relaciones que el modelo interno espera
 * para una N:M con tabla intermedia (N:M abstracta + 2 físicas 1:N hacia la intermedia, mismo
 * criterio que `TablaIntermediaService`) — así el frontend la reconoce y dibuja como siempre.
 * Corre dentro de la transacción de {@link XmiImportService}.
 */
@Service
class XmiImportEA {

    private final XmiCreadorEntidades creadorEntidades;
    private final AtributoEntidadService atributoEntidadService;
    private final RelacionDiagramaService relacionDiagramaService;

    XmiImportEA(XmiCreadorEntidades creadorEntidades, AtributoEntidadService atributoEntidadService,
            RelacionDiagramaService relacionDiagramaService) {
        this.creadorEntidades = creadorEntidades;
        this.atributoEntidadService = atributoEntidadService;
        this.relacionDiagramaService = relacionDiagramaService;
    }

    void importar(Long proyectoId, Document doc, Long usuarioId, Map<String, Long> existentesPorNombre) {
        Map<String, String> tipoSqlPorId = new HashMap<>();
        for (Element tipo : XmiDom.porEtiqueta(doc, "UML:DataType")) {
            if (tipo.hasAttribute("name")) {
                tipoSqlPorId.put(tipo.getAttribute("xmi.id"), tipo.getAttribute("name").toUpperCase());
            }
        }

        List<Element> clases = new ArrayList<>(XmiDom.porEtiqueta(doc, "UML:Class"));
        List<Element> asociacionesClase = XmiDom.porEtiqueta(doc, "UML:AssociationClass");
        clases.addAll(asociacionesClase);

        ResultadoEntidades resultado = creadorEntidades.crear(proyectoId, clases, usuarioId, existentesPorNombre, "xmi.id");
        crearAtributos(clases, tipoSqlPorId, resultado, usuarioId);

        Map<String, Long> entidadIdPorXmiId = resultado.idPorXmiId();
        crearAsociaciones(proyectoId, doc, entidadIdPorXmiId, usuarioId);
        crearGeneralizaciones(proyectoId, doc, entidadIdPorXmiId, usuarioId);
        crearAsociacionesClase(proyectoId, asociacionesClase, entidadIdPorXmiId, usuarioId);
    }

    private void crearAtributos(
            List<Element> clases, Map<String, String> tipoSqlPorId, ResultadoEntidades resultado, Long usuarioId) {
        for (Element clase : clases) {
            String xmiId = clase.getAttribute("xmi.id");
            if (resultado.xmiIdsReutilizados().contains(xmiId)) continue;
            Long entidadId = resultado.idPorXmiId().get(xmiId);
            List<Element> atributos = XmiDom.porEtiqueta(clase, "UML:Attribute");
            boolean tieneIdPropio = atributos.stream().anyMatch(a -> "id".equalsIgnoreCase(a.getAttribute("name")));
            for (Element attrEl : atributos) {
                String nombre = attrEl.getAttribute("name");
                String tipoSql = XmiMapeoEA.resolverTipoSqlEA(attrEl, tipoSqlPorId);
                boolean esPk = "id".equalsIgnoreCase(nombre)
                        || (!tieneIdPropio && nombre.toLowerCase().endsWith("_id"));
                atributoEntidadService.agregar(
                        entidadId, new AtributoEntidadRequest(nombre, tipoSql, esPk, false, null, !esPk), usuarioId);
            }
        }
    }

    private void crearAsociaciones(Long proyectoId, Document doc, Map<String, Long> entidadIdPorXmiId, Long usuarioId) {
        for (Element assoc : XmiDom.porEtiqueta(doc, "UML:Association")) {
            List<Element> extremos = XmiDom.porEtiqueta(assoc, "UML:AssociationEnd");
            if (extremos.size() < 2) continue;
            Long origenId = entidadIdPorXmiId.get(extremos.get(0).getAttribute("type"));
            Long destinoId = entidadIdPorXmiId.get(extremos.get(1).getAttribute("type"));
            if (origenId == null || destinoId == null) continue;

            TipoRelacionUml tipo = XmiMapeoEA.tipoDesdeAggregation(
                    extremos.get(0).getAttribute("aggregation"), extremos.get(1).getAttribute("aggregation"));
            crearRelacion(proyectoId, new RelacionDiagramaRequest(origenId, destinoId,
                    XmiMapeoEA.mapMultiplicidadEA(extremos.get(0).getAttribute("multiplicity")),
                    XmiMapeoEA.mapMultiplicidadEA(extremos.get(1).getAttribute("multiplicity")), tipo), usuarioId);
        }
    }

    private void crearGeneralizaciones(Long proyectoId, Document doc, Map<String, Long> entidadIdPorXmiId, Long usuarioId) {
        for (Element gen : XmiDom.porEtiqueta(doc, "UML:Generalization")) {
            String[] hijoYPadre = XmiMapeoEA.extremosGeneralizacion(gen);
            Long hijoId = entidadIdPorXmiId.get(hijoYPadre[0]);
            Long padreId = entidadIdPorXmiId.get(hijoYPadre[1]);
            if (hijoId != null && padreId != null) {
                crearRelacion(proyectoId, new RelacionDiagramaRequest(
                        hijoId, padreId, Multiplicidad.UNO, Multiplicidad.UNO, TipoRelacionUml.HERENCIA), usuarioId);
            }
        }
    }

    private void crearAsociacionesClase(
            Long proyectoId, List<Element> asociacionesClase, Map<String, Long> entidadIdPorXmiId, Long usuarioId) {
        for (Element assocClase : asociacionesClase) {
            Long junctionId = entidadIdPorXmiId.get(assocClase.getAttribute("xmi.id"));
            List<Element> extremos = XmiDom.porEtiqueta(assocClase, "UML:AssociationEnd");
            if (junctionId == null || extremos.size() < 2) continue;
            Long claseAId = entidadIdPorXmiId.get(extremos.get(0).getAttribute("type"));
            Long claseBId = entidadIdPorXmiId.get(extremos.get(1).getAttribute("type"));
            if (claseAId == null || claseBId == null) continue;

            crearRelacion(proyectoId, new RelacionDiagramaRequest(claseAId, claseBId,
                    XmiMapeoEA.mapMultiplicidadEA(extremos.get(0).getAttribute("multiplicity")),
                    XmiMapeoEA.mapMultiplicidadEA(extremos.get(1).getAttribute("multiplicity"))), usuarioId);
            crearRelacion(proyectoId, new RelacionDiagramaRequest(
                    claseAId, junctionId, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
            crearRelacion(proyectoId, new RelacionDiagramaRequest(
                    claseBId, junctionId, Multiplicidad.UNO, Multiplicidad.UNO_O_MAS), usuarioId);
        }
    }

    /** El archivo ya trae la tabla intermedia de cada N:M: nunca se auto-crea otra. */
    private void crearRelacion(Long proyectoId, RelacionDiagramaRequest request, Long usuarioId) {
        relacionDiagramaService.crearSinTablaIntermedia(proyectoId, request, usuarioId);
    }
}
