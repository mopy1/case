package com.casetool.backend.modules.chat.ia.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;

@ExtendWith(MockitoExtension.class)
class HerramientaBuscarHistorialTest {

    private static final Long P = 7L;
    private static final Long U = 3L;

    @Mock ProyectoAccesoService accesoService;
    @Mock ChatMensajeRepository chatRepo;
    @InjectMocks HerramientaBuscarHistorial herramienta;

    @Test
    void formateaResultadosConIdFechaYAutor() {
        when(chatRepo.buscarTextoCompleto(P, "borrado cliente", "", 5)).thenReturn(List.of(mensaje()));

        assertThat(herramienta.buscar(P, U, "  borrado cliente ", null, null))
                .isEqualTo("#12 · 2026-10-20 · maria: El borrado de Cliente será lógico");
        verify(accesoService).verificarMiembro(P, U);
    }

    @Test
    void consultaVaciaDaErrorSinConsultar() {
        assertThat(herramienta.buscar(P, U, "   ", null, null)).isEqualTo("ERROR: falta la consulta");
        verifyNoInteractions(chatRepo);
    }

    @Test
    void limiteSeAcotaA10YAutorSinArroba() {
        when(chatRepo.buscarTextoCompleto(eq(P), anyString(), eq("maria"), eq(10))).thenReturn(List.of());

        assertThat(herramienta.buscar(P, U, "índices", "@maria", 50)).isEqualTo("Sin resultados para \"índices\"");
    }

    @Test
    void consultaSeRecortaA200Caracteres() {
        when(chatRepo.buscarTextoCompleto(eq(P), argThat(q -> q.length() == 200), eq(""), eq(1))).thenReturn(List.of());

        herramienta.buscar(P, U, "a".repeat(500), "", 0);

        verify(chatRepo).buscarTextoCompleto(eq(P), argThat(q -> q.length() == 200), eq(""), eq(1));
    }

    @Test
    void noMiembroLanzaYNoBusca() {
        doThrow(new AccesoDenegadoProyectoException("No sos colaborador")).when(accesoService).verificarMiembro(P, 99L);

        assertThatThrownBy(() -> herramienta.buscar(P, 99L, "x", null, null)).isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(chatRepo);
    }

    private static ChatMensaje mensaje() {
        Usuario maria = new Usuario();
        maria.setUsername("maria");
        ChatMensaje m = new ChatMensaje();
        m.setId(12L);
        m.setUsuario(maria);
        m.setTipo(ChatMensaje.Tipo.USUARIO);
        m.setContenido("El borrado de Cliente\nserá lógico");
        m.setCreatedAt(Instant.parse("2026-10-20T12:00:00Z"));
        return m;
    }
}
