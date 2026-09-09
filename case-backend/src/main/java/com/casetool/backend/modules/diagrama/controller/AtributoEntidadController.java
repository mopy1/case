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

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.AtributoEntidadResponse;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/entidades/{entidadId}/atributos")
public class AtributoEntidadController {

    private final AtributoEntidadService atributoEntidadService;

    public AtributoEntidadController(AtributoEntidadService atributoEntidadService) {
        this.atributoEntidadService = atributoEntidadService;
    }

    @PostMapping
    public ResponseEntity<AtributoEntidadResponse> agregar(
            @PathVariable Long proyectoId,
            @PathVariable Long entidadId,
            @Valid @RequestBody AtributoEntidadRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(atributoEntidadService.agregar(entidadId, request, principal.getId()));
    }

    @PutMapping("/{atributoId}")
    public ResponseEntity<AtributoEntidadResponse> actualizar(
            @PathVariable Long proyectoId,
            @PathVariable Long entidadId,
            @PathVariable Long atributoId,
            @Valid @RequestBody AtributoEntidadRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(atributoEntidadService.actualizar(atributoId, request, principal.getId()));
    }

    @DeleteMapping("/{atributoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long proyectoId,
            @PathVariable Long entidadId,
            @PathVariable Long atributoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        atributoEntidadService.eliminar(atributoId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
