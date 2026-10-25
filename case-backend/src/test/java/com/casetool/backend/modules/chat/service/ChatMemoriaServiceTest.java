package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.chat.dto.ChatMemoriaResponse;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMemoria;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMemoriaRepository;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@ExtendWith(MockitoExtension.class)
class ChatMemoriaServiceTest {

    private static final Long P = 7L;

    @Mock ChatMemoriaRepository memoriaRepository;
    @Mock ProyectoRepository proyectoRepository;
    @Mock ProyectoAccesoService accesoService;
    @InjectMocks ChatMemoriaService service;

    @Test
    void sinFilaDevuelveDtoConNulls() {
        when(memoriaRepository.findById(P)).thenReturn(Optional.empty());

        assertThat(service.obtener(P, 3L)).isEqualTo(new ChatMemoriaResponse(P, null, null, null));
        verify(accesoService).verificarMiembro(P, 3L);
    }

    @Test
    void conFilaDevuelveResumenYMarca() {
        ChatMemoria m = memoria("- Decisiones: borrado lógico", 118L);
        when(memoriaRepository.findById(P)).thenReturn(Optional.of(m));

        ChatMemoriaResponse r = service.obtener(P, 3L);
        assertThat(r.resumen()).contains("borrado lógico");
        assertThat(r.ultimoMensajeResumidoId()).isEqualTo(118L);
    }

    @Test
    void noMiembroDa403YNoConsulta() {
        when(accesoService.verificarMiembro(P, 99L)).thenThrow(new AccesoDenegadoProyectoException("No sos colaborador"));

        assertThatThrownBy(() -> service.obtener(P, 99L)).isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(memoriaRepository);
    }

    @Test
    void guardarCreaLaFilaLaPrimeraVez() {
        Proyecto proyecto = ChatFixtures.proyecto(P);
        when(memoriaRepository.findById(P)).thenReturn(Optional.empty());
        when(proyectoRepository.getReferenceById(P)).thenReturn(proyecto);

        service.guardar(P, "resumen nuevo", 50L);

        ArgumentCaptor<ChatMemoria> captor = ArgumentCaptor.forClass(ChatMemoria.class);
        verify(memoriaRepository).save(captor.capture());
        assertThat(captor.getValue().getProyecto()).isSameAs(proyecto);
        assertThat(captor.getValue().getResumen()).isEqualTo("resumen nuevo");
        assertThat(captor.getValue().getUltimoMensajeResumidoId()).isEqualTo(50L);
    }

    @Test
    void guardarActualizaLaFilaExistente() {
        ChatMemoria existente = memoria("viejo", 10L);
        when(memoriaRepository.findById(P)).thenReturn(Optional.of(existente));

        service.guardar(P, "nuevo", 80L);

        verify(memoriaRepository).save(existente);
        assertThat(existente.getResumen()).isEqualTo("nuevo");
        assertThat(existente.getUltimoMensajeResumidoId()).isEqualTo(80L);
    }

    @Test
    void responseDeMensajeSeparaHerramientasPorComaONull() {
        ChatMensaje ia = ChatFixtures.mensaje(5L, ChatFixtures.proyecto(P), null);
        ia.setHerramientasUsadas("obtenerDiagrama,buscarEnHistorial");
        assertThat(ChatMensajeResponse.from(ia, null).herramientasUsadas())
                .isEqualTo(List.of("obtenerDiagrama", "buscarEnHistorial"));

        ia.setHerramientasUsadas(null);
        assertThat(ChatMensajeResponse.from(ia, null).herramientasUsadas()).isNull();
    }

    private ChatMemoria memoria(String resumen, Long marca) {
        ChatMemoria m = new ChatMemoria();
        m.setProyectoId(P);
        m.setResumen(resumen);
        m.setUltimoMensajeResumidoId(marca);
        m.setUpdatedAt(Instant.now());
        return m;
    }
}
