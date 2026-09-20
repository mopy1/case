package com.casetool.backend.modules.generator.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.generator.dto.GeneradorPreviewResponse;
import com.casetool.backend.modules.generator.service.GeneradorService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/generador")
public class GeneradorController {

    private final GeneradorService generadorService;

    public GeneradorController(GeneradorService generadorService) {
        this.generadorService = generadorService;
    }

    @GetMapping("/preview")
    public ResponseEntity<GeneradorPreviewResponse> preview(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(generadorService.obtenerPreview(proyectoId, principal.getId()));
    }

    @GetMapping("/descargar")
    public ResponseEntity<byte[]> descargar(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        byte[] zipData = generadorService.generarZip(proyectoId, principal.getId());
        String filename = "backend-proyecto-" + proyectoId + ".zip";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/zip"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(zipData);
    }
}
