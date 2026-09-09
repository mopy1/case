package com.casetool.backend.modules.diagrama.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/diagrama")
public class DiagramaController {

    private final DiagramaService diagramaService;

    public DiagramaController(DiagramaService diagramaService) {
        this.diagramaService = diagramaService;
    }

    @GetMapping
    public ResponseEntity<DiagramaResponse> obtenerDiagrama(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(diagramaService.obtenerDiagrama(proyectoId, principal.getId()));
    }
}
