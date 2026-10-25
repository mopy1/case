package com.casetool.backend.modules.chat.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.dto.ChatPresenciaResponse;
import com.casetool.backend.modules.chat.service.ChatMensajeService;
import com.casetool.backend.modules.chat.service.ChatPresenciaService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/chat")
public class ChatController {

    private final ChatMensajeService mensajeService;
    private final ChatPresenciaService presenciaService;

    public ChatController(ChatMensajeService mensajeService, ChatPresenciaService presenciaService) {
        this.mensajeService = mensajeService;
        this.presenciaService = presenciaService;
    }

    @GetMapping("/mensajes")
    public ResponseEntity<List<ChatMensajeResponse>> listar(
            @PathVariable Long proyectoId,
            @RequestParam(required = false) Long antesDe,
            @RequestParam(required = false) Integer limite,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(mensajeService.listar(proyectoId, antesDe, limite, principal.getId()));
    }

    @PostMapping("/mensajes")
    public ResponseEntity<ChatMensajeResponse> enviar(
            @PathVariable Long proyectoId,
            @Valid @RequestBody ChatMensajeRequest request,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mensajeService.enviar(proyectoId, request, principal.getId()));
    }

    @GetMapping("/presencia")
    public ResponseEntity<ChatPresenciaResponse> presencia(
            @PathVariable Long proyectoId,
            @AuthenticationPrincipal UsuarioPrincipal principal) {
        return ResponseEntity.ok(presenciaService.obtener(proyectoId, principal.getId()));
    }
}
