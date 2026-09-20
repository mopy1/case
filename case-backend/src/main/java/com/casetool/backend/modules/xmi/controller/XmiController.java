package com.casetool.backend.modules.xmi.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;
import com.casetool.backend.modules.xmi.service.XmiExportService;
import com.casetool.backend.modules.xmi.service.XmiImportService;

/** Fase 3 — interoperabilidad con Enterprise Architect (`.xmi`, ver `XmiExportService`/
 * `XmiImportService` para el detalle del formato). Exportar es `GET` (solo lectura, cualquier
 * miembro hasta LECTOR); importar es `POST` con el mismo permiso de escritura que crear una
 * entidad a mano. */
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/xmi")
public class XmiController {

    private final XmiExportService exportService;
    private final XmiImportService importService;

    public XmiController(XmiExportService exportService, XmiImportService importService) {
        this.exportService = exportService;
        this.importService = importService;
    }

    @GetMapping("/exportar")
    public ResponseEntity<String> exportar(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        String xmi = exportService.exportar(proyectoId, principal.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("diagrama-" + proyectoId + ".xmi").build().toString())
                .body(xmi);
    }

    @PostMapping("/importar")
    public ResponseEntity<DiagramaResponse> importar(
            @PathVariable Long proyectoId,
            @RequestParam("archivo") MultipartFile archivo,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(importService.importar(proyectoId, archivo, principal.getId()));
    }
}
