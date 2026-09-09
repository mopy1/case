package com.casetool.backend.modules.proyecto.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.proyecto.dto.NotaProyectoRequest;
import com.casetool.backend.modules.proyecto.dto.NotaProyectoResponse;
import com.casetool.backend.modules.proyecto.service.NotaProyectoService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/notas")
public class NotaProyectoController {

    private final NotaProyectoService notaProyectoService;

    public NotaProyectoController(NotaProyectoService notaProyectoService) {
        this.notaProyectoService = notaProyectoService;
    }

    @PostMapping
    public ResponseEntity<NotaProyectoResponse> crear(
            @PathVariable Long proyectoId,
            @Valid @RequestBody NotaProyectoRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notaProyectoService.crear(proyectoId, request, principal.getId()));
    }

    @GetMapping
    public ResponseEntity<List<NotaProyectoResponse>> listar(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(notaProyectoService.listar(proyectoId, principal.getId()));
    }
}
