package com.casetool.backend.core.ia.motor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.core.ia.motor.dto.MotorIaProbarRequest;
import com.casetool.backend.core.ia.motor.dto.MotorIaProbarResponse;
import com.casetool.backend.core.ia.motor.dto.MotorIaRequest;
import com.casetool.backend.core.ia.motor.dto.MotorIaResponse;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

/** Motor de IA del usuario autenticado (Copilot y Senior Dev): DeepSeek o Qwen 3.5 en Kaggle. */
@RestController
@RequestMapping("/api/ia/motor")
public class MotorIaController {

    private final MotorIaService service;

    public MotorIaController(MotorIaService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<MotorIaResponse> obtener(@AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(service.obtener(principal.getId()));
    }

    @PutMapping
    public ResponseEntity<MotorIaResponse> guardar(@Valid @RequestBody MotorIaRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(service.guardar(principal.getId(), request));
    }

    @PostMapping("/probar")
    public ResponseEntity<MotorIaProbarResponse> probar(@Valid @RequestBody MotorIaProbarRequest request) {
        return ResponseEntity.ok(service.probar(request.url()));
    }
}
