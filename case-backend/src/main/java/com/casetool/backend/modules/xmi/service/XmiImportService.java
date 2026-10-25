package com.casetool.backend.modules.xmi.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.xmi.dto.ModoImportacionXmi;
import com.casetool.backend.modules.xmi.dto.XmiPreviewResponse;

/**
 * Lee un `.xmi` y recrea entidades, atributos y relaciones en un proyecto, reusando los services
 * normales del módulo `diagrama` (misma validación de nombres duplicados, mismos chequeos de
 * permiso, que crear todo a mano desde el lienzo). Reconoce <b>dos dialectos</b>, detectados por
 * la forma del documento ({@link XmiDom#esDialectoEA}) — el usuario no tiene que indicar cuál es:
 * <ol>
 *   <li><b>Enterprise Architect / XMI 1.1</b> — el que genera {@link XmiExportService}. Ver
 *       {@link XmiImportEA}.</li>
 *   <li><b>Propio XMI 2.1</b> (versiones viejas de esta herramienta). Ver {@link XmiImportPropio}.</li>
 * </ol>
 * Todo corre en UNA transacción: si algo falla a mitad de camino, no queda nada a medias.
 */
@Service
@Transactional
public class XmiImportService {

    private final EntidadDiagramaService entidadDiagramaService;
    private final DiagramaService diagramaService;
    private final ProyectoAccesoService accesoService;
    private final XmiImportEA importEA;
    private final XmiImportPropio importPropio;

    public XmiImportService(
            EntidadDiagramaService entidadDiagramaService,
            DiagramaService diagramaService,
            ProyectoAccesoService accesoService,
            XmiImportEA importEA,
            XmiImportPropio importPropio) {
        this.entidadDiagramaService = entidadDiagramaService;
        this.diagramaService = diagramaService;
        this.accesoService = accesoService;
        this.importEA = importEA;
        this.importPropio = importPropio;
    }

    /**
     * Importar exige rol ADMIN — pedido explícito del profesor (2026-09-26): si cualquier
     * `COLABORADOR` pudiera meter un diagrama de Enterprise Architect al lienzo compartido,
     * varios importando a la vez chocarían nombres de tabla entre sí. Solo el ADMIN, que es quien
     * tiene la vista completa del proyecto, decide qué entra.
     */
    public DiagramaResponse importar(Long proyectoId, MultipartFile archivo, Long usuarioId, ModoImportacionXmi modo) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        // Se parsea ANTES de borrar nada: un archivo inválido corta acá sin tocar el diagrama.
        Document doc = XmiDom.parsear(archivo);

        if (modo == ModoImportacionXmi.REEMPLAZAR) {
            entidadDiagramaService.eliminarTodo(proyectoId);
        }

        Map<String, Long> existentesPorNombre = entidadesExistentesPorNombre(proyectoId, usuarioId);
        if (XmiDom.esDialectoEA(doc)) {
            importEA.importar(proyectoId, doc, usuarioId, existentesPorNombre);
        } else {
            importPropio.importar(proyectoId, doc, usuarioId, existentesPorNombre);
        }
        return diagramaService.obtenerDiagrama(proyectoId, usuarioId);
    }

    /**
     * Previsualización de solo lectura — no crea nada, se llama antes de {@link #importar} para
     * que el ADMIN vea qué va a pasar (qué tablas trae el archivo, cuáles ya existen en el
     * proyecto — esas se reusan tal cual en modo FUSIONAR — y cuántas relaciones trae) y recién
     * ahí confirme modo y disparo real. También exige ADMIN: no tiene sentido dejarle
     * previsualizar a alguien que después no puede confirmar.
     */
    public XmiPreviewResponse previsualizar(Long proyectoId, MultipartFile archivo, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        Document doc = XmiDom.parsear(archivo);
        boolean esDialectoEA = XmiDom.esDialectoEA(doc);

        List<String> tablas;
        int totalRelaciones;
        if (esDialectoEA) {
            List<Element> clases = new ArrayList<>(XmiDom.porEtiqueta(doc, "UML:Class"));
            clases.addAll(XmiDom.porEtiqueta(doc, "UML:AssociationClass"));
            tablas = clases.stream().map(c -> c.getAttribute("name")).toList();
            totalRelaciones = XmiDom.porEtiqueta(doc, "UML:Association").size()
                    + XmiDom.porEtiqueta(doc, "UML:Generalization").size();
        } else {
            List<Element> clases = XmiDom.elementosPorTipo(doc, "uml:Class");
            tablas = clases.stream().map(c -> c.getAttribute("name")).toList();
            totalRelaciones = XmiDom.elementosPorTipo(doc, "uml:Association").size();
        }

        Map<String, Long> existentesPorNombre = entidadesExistentesPorNombre(proyectoId, usuarioId);
        List<String> tablasExistentes = tablas.stream().filter(existentesPorNombre::containsKey).toList();

        return new XmiPreviewResponse(
                esDialectoEA ? "Enterprise Architect (XMI 1.1)" : "CASE Tool (XMI 2.1)",
                tablas, tablasExistentes, totalRelaciones, existentesPorNombre.size());
    }

    /** Nombre → id de cada entidad ya presente en el proyecto — usado por la previsualización y
     * por el import en modo FUSIONAR para reusar la existente en vez de duplicarla o fallar. */
    private Map<String, Long> entidadesExistentesPorNombre(Long proyectoId, Long usuarioId) {
        return diagramaService.obtenerDiagrama(proyectoId, usuarioId).entidades().stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::nombre, EntidadDiagramaResponse::id));
    }
}
