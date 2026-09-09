package com.casetool.backend.modules.proyecto.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.proyecto.dto.CambiarEstadoTareaRequest;
import com.casetool.backend.modules.proyecto.dto.TareaProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.TareaProyectoResponse;
import com.casetool.backend.modules.proyecto.service.TareaProyectoService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/tareas")
public class TareaProyectoController {

    private final TareaProyectoService tareaProyectoService;

    public TareaProyectoController(TareaProyectoService tareaProyectoService) {
        this.tareaProyectoService = tareaProyectoService;
    }

    @PostMapping
    public ResponseEntity<TareaProyectoResponse> crear(
            @PathVariable Long proyectoId,
            @Valid @RequestBody TareaProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tareaProyectoService.crear(request, proyectoId, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<TareaProyectoResponse>> listarPorProyecto(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(tareaProyectoService.listarPorProyecto(proyectoId, principal.getId()));
    }

    @GetMapping("/{tareaId}")
    public ResponseEntity<TareaProyectoResponse> obtenerPorId(
            @PathVariable Long proyectoId,
            @PathVariable Long tareaId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(tareaProyectoService.obtenerPorId(tareaId, principal.getId()));
    }

    @PutMapping("/{tareaId}")
    public ResponseEntity<TareaProyectoResponse> actualizar(
            @PathVariable Long proyectoId,
            @PathVariable Long tareaId,
            @Valid @RequestBody TareaProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(tareaProyectoService.actualizar(tareaId, request, principal.getId()));
    }

    @PatchMapping("/{tareaId}/estado")
    public ResponseEntity<TareaProyectoResponse> cambiarEstado(
            @PathVariable Long proyectoId,
            @PathVariable Long tareaId,
            @Valid @RequestBody CambiarEstadoTareaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(tareaProyectoService.cambiarEstadoTarea(request, tareaId, principal.getId()));
    }

    @DeleteMapping("/{tareaId}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long proyectoId,
            @PathVariable Long tareaId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        tareaProyectoService.eliminar(tareaId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
