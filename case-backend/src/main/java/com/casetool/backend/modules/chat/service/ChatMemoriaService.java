package com.casetool.backend.modules.chat.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.chat.dto.ChatMemoriaResponse;
import com.casetool.backend.modules.chat.model.ChatMemoria;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@Service
@Transactional
public class ChatMemoriaService {

    private final ChatMemoriaRepository memoriaRepository;
    private final ProyectoRepository proyectoRepository;
    private final ProyectoAccesoService accesoService;

    public ChatMemoriaService(ChatMemoriaRepository memoriaRepository, ProyectoRepository proyectoRepository,
            ProyectoAccesoService accesoService) {
        this.memoriaRepository = memoriaRepository;
        this.proyectoRepository = proyectoRepository;
        this.accesoService = accesoService;
    }

    /** Cualquier miembro (incluido LECTOR) ve la memoria; si todavía no hay, campos en null. */
    @Transactional(readOnly = true)
    public ChatMemoriaResponse obtener(Long proyectoId, Long usuarioId) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        return memoriaRepository.findById(proyectoId)
                .map(ChatMemoriaResponse::from)
                .orElseGet(() -> ChatMemoriaResponse.vacia(proyectoId));
    }

    /** Uso interno del resumidor (sin usuario): crea la fila la primera vez y después la actualiza. */
    public void guardar(Long proyectoId, String resumen, Long ultimoMensajeResumidoId) {
        ChatMemoria memoria = memoriaRepository.findById(proyectoId).orElseGet(() -> {
            ChatMemoria nueva = new ChatMemoria();
            nueva.setProyecto(proyectoRepository.getReferenceById(proyectoId));
            return nueva;
        });
        memoria.setResumen(resumen);
        memoria.setUltimoMensajeResumidoId(ultimoMensajeResumidoId);
        memoriaRepository.save(memoria);
    }
}
