package com.casetool.backend.modules.chat.ia;

import static com.casetool.backend.modules.chat.ia.SeniorDevLimites.*;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Component;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.chat.model.ChatMemoria;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.chat.service.ChatMemoriaService;

/**
 * Resumen acumulado (capa 2): resume solo lo que ya salió de la ventana de los últimos 30 mensajes,
 * cuando hay al menos 20 pendientes, de a lotes de 100. Si falla, se conserva el resumen anterior.
 */
@Component
public class SeniorDevResumidor {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevResumidor.class);

    private final ChatMensajeRepository chatRepo;
    private final ChatMemoriaRepository memoriaRepo;
    private final ChatMemoriaService memoriaService;
    private final DeepSeekClient deepSeek;

    public SeniorDevResumidor(ChatMensajeRepository chatRepo, ChatMemoriaRepository memoriaRepo,
            ChatMemoriaService memoriaService, DeepSeekClient deepSeek) {
        this.chatRepo = chatRepo;
        this.memoriaRepo = memoriaRepo;
        this.memoriaService = memoriaService;
        this.deepSeek = deepSeek;
    }

    public void actualizarSiCorresponde(Long proyectoId) {
        List<ChatMensaje> ventana = chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(
                proyectoId, Limit.of(HISTORIAL_MENSAJES));
        if (ventana.size() < HISTORIAL_MENSAJES) {
            return; // todo cabe en la memoria corta
        }
        long corte = ventana.stream().mapToLong(ChatMensaje::getId).min().orElseThrow();
        ChatMemoria actual = memoriaRepo.findById(proyectoId).orElse(null);
        long marca = actual != null ? actual.getUltimoMensajeResumidoId() : 0L;
        long pendientes = chatRepo.countByProyectoIdAndIdGreaterThanAndIdLessThan(proyectoId, marca, corte);
        if (pendientes < RESUMEN_CADA) {
            return;
        }
        List<ChatMensaje> lote = chatRepo.findByProyectoIdAndIdGreaterThanAndIdLessThanOrderByIdAsc(
                proyectoId, marca, corte, Limit.of(RESUMEN_LOTE_MAX));
        String entrada = "RESUMEN ANTERIOR:\n" + (actual != null ? actual.getResumen() : "(vacío)")
                + "\n\nMENSAJES NUEVOS:\n" + SeniorDevHistorialFormatter.lote(lote);
        try {
            String resumen = deepSeek.solicitarRespuesta(
                    List.of(DeepSeekMensaje.system(SeniorDevPrompts.RESUMEN_PROMPT), DeepSeekMensaje.user(entrada)),
                    RESUMEN_TEMPERATURA, RESUMEN_MAX_TOKENS);
            Long nuevaMarca = lote.get(lote.size() - 1).getId();
            memoriaService.guardar(proyectoId, recortar(resumen, RESUMEN_MAX_CHARS), nuevaMarca);
            log.info("Memoria del proyecto {} actualizada: {} mensajes, marca #{}", proyectoId, lote.size(), nuevaMarca);
        } catch (Exception ex) {
            log.warn("No se pudo actualizar la memoria del proyecto {}: {}", proyectoId, ex.getMessage());
        }
    }
}
