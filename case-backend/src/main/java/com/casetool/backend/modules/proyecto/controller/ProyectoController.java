package com.casetool.backend.modules.proyecto.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.proyecto.dto.ProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.ProyectoResponse;
import com.casetool.backend.modules.proyecto.service.ProyectoService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos")
public class ProyectoController {

    private final ProyectoService proyectoService;

    public ProyectoController(ProyectoService proyectoService) {
        this.proyectoService = proyectoService;
    }

    @PostMapping
    public ResponseEntity<ProyectoResponse> crear(
            @Valid @RequestBody ProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(proyectoService.crear(request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<ProyectoResponse>> listarMisProyectos(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(proyectoService.listarMisProyectos(principal.getId()));
    }

    @GetMapping("/{proyectoId}")
    public ResponseEntity<ProyectoResponse> obtenerPorId(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(proyectoService.obtenerPorId(proyectoId, principal.getId()));
    }

    @PutMapping("/{proyectoId}")
    public ResponseEntity<ProyectoResponse> actualizar(
            @PathVariable Long proyectoId,
            @Valid @RequestBody ProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(proyectoService.actualizar(proyectoId, request, principal.getId()));
    }

    @DeleteMapping("/{proyectoId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        proyectoService.eliminar(proyectoId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
