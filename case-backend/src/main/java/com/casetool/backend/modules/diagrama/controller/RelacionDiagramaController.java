package com.casetool.backend.modules.diagrama.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/relaciones")
public class RelacionDiagramaController {

    private final RelacionDiagramaService relacionDiagramaService;

    public RelacionDiagramaController(RelacionDiagramaService relacionDiagramaService) {
        this.relacionDiagramaService = relacionDiagramaService;
    }

    @PostMapping
    public ResponseEntity<RelacionDiagramaResponse> crear(
            @PathVariable Long proyectoId,
            @Valid @RequestBody RelacionDiagramaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(relacionDiagramaService.crear(proyectoId, request, principal.getId()));
    }

    @DeleteMapping("/{relacionId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long proyectoId,
            @PathVariable Long relacionId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        relacionDiagramaService.eliminar(relacionId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
