package com.casetool.backend.modules.copilot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.copilot.dto.CopilotConsultaRequest;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.service.CopilotService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

/** Copilot personal (Asistente y Guía): la IA corre en el servidor, el navegador nunca ve las claves. */
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/copilot")
public class CopilotController {

    private final CopilotService copilotService;

    public CopilotController(CopilotService copilotService) {
        this.copilotService = copilotService;
    }

    @PostMapping("/consultas")
    public ResponseEntity<CopilotConsultaResponse> consultar(
            @PathVariable Long proyectoId,
            @Valid @RequestBody CopilotConsultaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(copilotService.consultar(proyectoId, principal.getId(), principal.getUsername(), request));
    }
}
