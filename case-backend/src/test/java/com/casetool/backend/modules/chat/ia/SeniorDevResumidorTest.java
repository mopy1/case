package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.LongStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;

import com.casetool.backend.modules.chat.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.chat.model.ChatMemoria;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.chat.service.ChatMemoriaService;

@ExtendWith(MockitoExtension.class)
class SeniorDevResumidorTest {

    private static final Long P = 7L;

    @Mock ChatMensajeRepository chatRepo;
    @Mock ChatMemoriaRepository memoriaRepo;
    @Mock ChatMemoriaService memoriaService;
    @Mock DeepSeekClient deepSeek;

    private SeniorDevResumidor resumidor;

    @BeforeEach
    void setUp() {
        resumidor = new SeniorDevResumidor(chatRepo, memoriaRepo, memoriaService, deepSeek);
    }

    @Test
    void conMenosDe30MensajesNoHaceNada() {
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(P, Limit.of(30))).thenReturn(mensajes(31, 50));

        resumidor.actualizarSiCorresponde(P);

        verifyNoInteractions(deepSeek, memoriaService);
    }

    @Test
    void conMenosDe20PendientesNoLlamaADeepSeek() {
        ventanaDesde(71L);
        when(memoriaRepo.findById(P)).thenReturn(Optional.of(memoria("previo", 60L)));
        when(chatRepo.countByProyectoIdAndIdGreaterThanAndIdLessThan(P, 60L, 71L)).thenReturn(10L);

        resumidor.actualizarSiCorresponde(P);

        verifyNoInteractions(deepSeek, memoriaService);
    }

    @Test
    @SuppressWarnings("unchecked")
    void con20oMasPendientesGuardaResumenRecortadoYMarcaDelUltimoDelLote() {
        ventanaDesde(71L);
        when(memoriaRepo.findById(P)).thenReturn(Optional.empty());
        when(chatRepo.countByProyectoIdAndIdGreaterThanAndIdLessThan(P, 0L, 71L)).thenReturn(70L);
        when(chatRepo.findByProyectoIdAndIdGreaterThanAndIdLessThanOrderByIdAsc(P, 0L, 71L, Limit.of(100)))
                .thenReturn(mensajes(1, 70));
        when(deepSeek.solicitarRespuesta(any(), eq(0.2), eq(600))).thenReturn("x".repeat(5000));

        resumidor.actualizarSiCorresponde(P);

        ArgumentCaptor<String> resumen = ArgumentCaptor.forClass(String.class);
        verify(memoriaService).guardar(eq(P), resumen.capture(), eq(70L));
        assertThat(resumen.getValue()).hasSize(SeniorDevLimites.RESUMEN_MAX_CHARS);
        ArgumentCaptor<List<DeepSeekMensaje>> prompt = ArgumentCaptor.forClass(List.class);
        verify(deepSeek).solicitarRespuesta(prompt.capture(), anyDouble(), anyInt());
        assertThat(prompt.getValue().get(0).content()).isEqualTo(SeniorDevPrompts.RESUMEN_PROMPT);
        assertThat(prompt.getValue().get(1).content()).contains("RESUMEN ANTERIOR:\n(vacío)").contains("#1 [Sistema]: m1");
    }

    @Test
    void errorDeDeepSeekNoGuardaYConservaElResumenAnterior() {
        ventanaDesde(71L);
        when(memoriaRepo.findById(P)).thenReturn(Optional.of(memoria("previo", 20L)));
        when(chatRepo.countByProyectoIdAndIdGreaterThanAndIdLessThan(P, 20L, 71L)).thenReturn(50L);
        when(chatRepo.findByProyectoIdAndIdGreaterThanAndIdLessThanOrderByIdAsc(eq(P), eq(20L), eq(71L), any()))
                .thenReturn(mensajes(21, 70));
        when(deepSeek.solicitarRespuesta(any(), anyDouble(), anyInt())).thenThrow(new RuntimeException("429"));

        resumidor.actualizarSiCorresponde(P);

        verifyNoInteractions(memoriaService);
    }

    /** Ventana de 30 mensajes cuyo id más viejo es {@code desde}. */
    private void ventanaDesde(long desde) {
        when(chatRepo.findByProyectoIdOrderByCreatedAtDescIdDesc(P, Limit.of(30)))
                .thenReturn(mensajes(desde, desde + 29).reversed());
    }

    private static List<ChatMensaje> mensajes(long desde, long hasta) {
        return LongStream.rangeClosed(desde, hasta).mapToObj(id -> {
            ChatMensaje m = new ChatMensaje();
            m.setId(id);
            m.setTipo(ChatMensaje.Tipo.SISTEMA);
            m.setContenido("m" + id);
            return m;
        }).toList();
    }

    private static ChatMemoria memoria(String resumen, Long marca) {
        ChatMemoria m = new ChatMemoria();
        m.setResumen(resumen);
        m.setUltimoMensajeResumidoId(marca);
        return m;
    }
}
