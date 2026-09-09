package com.casetool.backend.modules.diagrama.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/entidades")
public class EntidadDiagramaController {

    private final EntidadDiagramaService entidadDiagramaService;

    public EntidadDiagramaController(EntidadDiagramaService entidadDiagramaService) {
        this.entidadDiagramaService = entidadDiagramaService;
    }

    @PostMapping
    public ResponseEntity<EntidadDiagramaResponse> crear(
            @PathVariable Long proyectoId,
            @Valid @RequestBody EntidadDiagramaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(entidadDiagramaService.crear(proyectoId, request, principal.getId()));
    }

    @PutMapping("/{entidadId}")
    public ResponseEntity<EntidadDiagramaResponse> actualizar(
            @PathVariable Long proyectoId,
            @PathVariable Long entidadId,
            @Valid @RequestBody EntidadDiagramaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(entidadDiagramaService.actualizar(entidadId, request, principal.getId()));
    }

    @DeleteMapping("/{entidadId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long proyectoId,
            @PathVariable Long entidadId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        entidadDiagramaService.eliminar(entidadId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
