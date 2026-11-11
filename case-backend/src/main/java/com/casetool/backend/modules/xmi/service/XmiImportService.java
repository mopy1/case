package com.casetool.backend.modules.xmi.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.w3c.dom.Document;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.xmi.dto.ModoImportacionXmi;
import com.casetool.backend.modules.xmi.dto.XmiPreviewResponse;
import com.casetool.backend.modules.xmi.service.lector.LectorXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi;

/**
 * Lee un `.xmi`/`.xml` y recrea entidades, atributos y relaciones en un proyecto, reusando los services
 * normales del módulo `diagrama` (misma validación y permisos que dibujar a mano). Acepta los 3 formatos
 * que exporta Enterprise Architect (XMI 1.1, XMI 2.1 y Native) y los de esta herramienta, detectados
 * por la forma del documento: cada {@link LectorXmi} lo traduce a un {@link ModeloXmi} y
 * {@link XmiMaterializador} lo crea igual para todos (genera las tablas intermedias de las N:M).
 * Todo corre en UNA transacción: si algo falla a mitad de camino, no queda nada a medias.
 */
@Service
@Transactional
public class XmiImportService {

    private final EntidadDiagramaService entidadDiagramaService;
    private final DiagramaService diagramaService;
    private final ProyectoAccesoService accesoService;
    private final List<LectorXmi> lectores;
    private final XmiMaterializador materializador;

    public XmiImportService(EntidadDiagramaService entidadDiagramaService, DiagramaService diagramaService,
            ProyectoAccesoService accesoService, List<LectorXmi> lectores, XmiMaterializador materializador) {
        this.entidadDiagramaService = entidadDiagramaService;
        this.diagramaService = diagramaService;
        this.accesoService = accesoService;
        this.lectores = lectores;
        this.materializador = materializador;
    }

    /** Importar exige rol ADMIN (pedido del profesor, 2026-09-26): evita choques de nombres entre colaboradores. */
    public DiagramaResponse importar(Long proyectoId, MultipartFile archivo, Long usuarioId, ModoImportacionXmi modo) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        // Se parsea ANTES de borrar nada: un archivo inválido corta acá sin tocar el diagrama.
        ModeloXmi modelo = leer(archivo);
        if (modo == ModoImportacionXmi.REEMPLAZAR) {
            entidadDiagramaService.eliminarTodo(proyectoId);
        }
        materializador.materializar(proyectoId, modelo, usuarioId, entidadesExistentesPorNombre(proyectoId, usuarioId));
        return diagramaService.obtenerDiagrama(proyectoId, usuarioId);
    }

    /** Previsualización de solo lectura (también ADMIN): tablas del archivo + intermedias que se generarán. */
    public XmiPreviewResponse previsualizar(Long proyectoId, MultipartFile archivo, Long usuarioId) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        accesoService.verificarRolAdmin(miembro);

        ModeloXmi modelo = leer(archivo);
        List<String> tablas = new java.util.ArrayList<>(modelo.clases().stream().map(ModeloXmi.ClaseXmi::nombre).toList());
        tablas.addAll(XmiIntermedias.nombresGenerados(modelo));
        Map<String, Long> existentesPorNombre = entidadesExistentesPorNombre(proyectoId, usuarioId);
        List<String> tablasExistentes = tablas.stream().filter(existentesPorNombre::containsKey).toList();
        return new XmiPreviewResponse(modelo.dialecto(), tablas, tablasExistentes,
                XmiMaterializador.contarRelaciones(modelo), existentesPorNombre.size());
    }

    private ModeloXmi leer(MultipartFile archivo) {
        Document doc = XmiDom.parsear(archivo);
        return lectores.stream().filter(l -> l.reconoce(doc)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Formato no reconocido: se acepta XMI 1.1, XMI 2.1 o Native de Enterprise Architect"))
                .leer(doc);
    }

    /** Nombre → id de cada entidad ya presente (FUSIONAR reusa la existente en vez de duplicarla). */
    private Map<String, Long> entidadesExistentesPorNombre(Long proyectoId, Long usuarioId) {
        return diagramaService.obtenerDiagrama(proyectoId, usuarioId).entidades().stream()
                .collect(Collectors.toMap(EntidadDiagramaResponse::nombre, EntidadDiagramaResponse::id, (a, b) -> a, HashMap::new));
    }
}
