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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.proyecto.dto.CambiarRolMiembroRequest;
import com.casetool.backend.modules.proyecto.dto.MiembroProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.MiembroProyectoResponse;
import com.casetool.backend.modules.proyecto.service.MiembroProyectoService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/miembros")
public class MiembroProyectoController {

    private final MiembroProyectoService miembroProyectoService;

    public MiembroProyectoController(MiembroProyectoService miembroProyectoService) {
        this.miembroProyectoService = miembroProyectoService;
    }

    @PostMapping
    public ResponseEntity<MiembroProyectoResponse> agregar(
            @PathVariable Long proyectoId,
            @Valid @RequestBody MiembroProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(miembroProyectoService.agregar(proyectoId, request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<MiembroProyectoResponse>> listar(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(miembroProyectoService.listar(proyectoId, principal.getId()));
    }

    @PatchMapping("/{usuarioObjetivoId}/rol")
    public ResponseEntity<MiembroProyectoResponse> cambiarRol(
            @PathVariable Long proyectoId,
            @PathVariable Long usuarioObjetivoId,
            @Valid @RequestBody CambiarRolMiembroRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(
                miembroProyectoService.cambiarRol(proyectoId, usuarioObjetivoId, request.rol(), principal.getId()));
    }

    @DeleteMapping("/{usuarioObjetivoId}")
    public ResponseEntity<Void> quitar(
            @PathVariable Long proyectoId,
            @PathVariable Long usuarioObjetivoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        miembroProyectoService.quitar(proyectoId, usuarioObjetivoId, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
