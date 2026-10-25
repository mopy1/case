package com.casetool.backend.modules.diagrama.controller;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.diagrama.service.DdlPostgresService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/ddl")
public class DdlController {

    private final DdlPostgresService ddlService;

    public DdlController(DdlPostgresService ddlService) {
        this.ddlService = ddlService;
    }

    @GetMapping
    public ResponseEntity<String> obtenerDdl(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_PLAIN, StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"esquema-" + proyectoId + ".sql\"")
                .body(ddlService.generar(proyectoId, principal.getId()));
    }
}
