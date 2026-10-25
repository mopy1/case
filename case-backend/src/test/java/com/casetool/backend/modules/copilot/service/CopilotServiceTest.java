package com.casetool.backend.modules.copilot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.copilot.CopilotFixtures;
import com.casetool.backend.modules.copilot.dto.*;
import com.casetool.backend.modules.copilot.exception.CopilotCuotaExcedidaException;
import com.casetool.backend.modules.copilot.guia.GuiaContexto;
import com.casetool.backend.modules.copilot.guia.GuiaService;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

@ExtendWith(MockitoExtension.class)
class CopilotServiceTest {

    private static final Long P = 5L;
    private static final Long U = 3L;
    private static final CopilotConsultaResponse OK = new CopilotConsultaResponse("ok", OrigenRespuesta.DEEPSEEK, null);

    @Mock ProyectoAccesoService acceso;
    @Mock DiagramaService diagramaService;
    @Mock CopilotCuota cuota;
    @Mock CopilotAsistente asistente;
    @Mock CopilotVision vision;
    @Mock GuiaService guia;

    private CopilotService service;

    @BeforeEach
    void setUp() {
        service = new CopilotService(acceso, diagramaService, cuota, asistente, vision, guia);
    }

    private void miembro(MiembroProyecto.Rol rol) {
        MiembroProyecto m = new MiembroProyecto();
        m.setRol(rol);
        when(acceso.verificarMiembro(P, U)).thenReturn(m);
    }

    private CopilotConsultaResponse consultar(String texto, String img, ModoCopilot modo) {
        return service.consultar(P, U, "ana", new CopilotConsultaRequest(texto, img, "diagrama", modo, null, null));
    }

    @Test
    void textoEImagenVaciosDa400SinGastarCuota() {
        miembro(MiembroProyecto.Rol.ADMIN);
        assertThatThrownBy(() -> consultar("   ", null, null))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("Escribí una consulta o adjuntá una imagen");
        verifyNoInteractions(cuota, asistente);
    }

    @Test
    void guiaConImagenDa400() {
        miembro(MiembroProyecto.Rol.ADMIN);
        assertThatThrownBy(() -> consultar(null, "AAAA", ModoCopilot.GUIA))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("La Guía no analiza imágenes; usá el modo Asistente");
    }

    @Test
    void base64InvalidoDa400() {
        miembro(MiembroProyecto.Rol.ADMIN);
        assertThatThrownBy(() -> consultar(null, "%%%", null))
                .isInstanceOf(IllegalArgumentException.class).hasMessage("La imagen no es válida");
        verifyNoInteractions(cuota);
    }

    @Test
    void noMiembroDa403AntesDeTodo() {
        when(acceso.verificarMiembro(P, U)).thenThrow(new AccesoDenegadoProyectoException("No sos colaborador de este proyecto"));
        assertThatThrownBy(() -> consultar("hola", null, null)).isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(cuota, diagramaService);
    }

    @Test
    void cuotaExcedidaNoLeeElDiagramaNiLlamaALaIa() {
        miembro(MiembroProyecto.Rol.ADMIN);
        doThrow(new CopilotCuotaExcedidaException("x")).when(cuota).registrar(U);
        assertThatThrownBy(() -> consultar("hola", null, null)).isInstanceOf(CopilotCuotaExcedidaException.class);
        verifyNoInteractions(diagramaService, asistente);
    }

    @Test
    void textoSinModoVaAlAsistenteConElDiagrama() {
        miembro(MiembroProyecto.Rol.LECTOR);
        var diagrama = CopilotFixtures.libroAutor();
        when(diagramaService.obtenerDiagrama(P, U)).thenReturn(diagrama);
        when(asistente.responder("hola", "diagrama", diagrama)).thenReturn(OK);

        assertThat(consultar("  hola ", null, null)).isSameAs(OK);
        verify(cuota).registrar(U);
    }

    @Test
    void imagenVaAGeminiAunqueHayaTexto() {
        miembro(MiembroProyecto.Rol.ADMIN);
        when(diagramaService.obtenerDiagrama(P, U)).thenReturn(CopilotFixtures.vacio());
        when(vision.responder(eq("mirá"), eq("QUJD"), any())).thenReturn(OK);

        assertThat(consultar("mirá", "QUJD", ModoCopilot.ASISTENTE)).isSameAs(OK);
        verifyNoInteractions(asistente, guia);
    }

    @Test
    void guiaRecibeElContextoCompleto() {
        miembro(MiembroProyecto.Rol.COLABORADOR);
        when(diagramaService.obtenerDiagrama(P, U)).thenReturn(CopilotFixtures.vacio());
        when(guia.responder(any())).thenReturn(OK);
        var historial = List.of(new CopilotTurno("usuario", "hola"));
        var req = new CopilotConsultaRequest("¿qué hago?", null, null, ModoCopilot.GUIA, historial, List.of(MisionGuia.RELACIONAR));

        service.consultar(P, U, "ana", req);

        ArgumentCaptor<GuiaContexto> ctx = ArgumentCaptor.forClass(GuiaContexto.class);
        verify(guia).responder(ctx.capture());
        assertThat(ctx.getValue().username()).isEqualTo("ana");
        assertThat(ctx.getValue().rol()).isEqualTo(MiembroProyecto.Rol.COLABORADOR);
        assertThat(ctx.getValue().seccion()).isEqualTo("general");
        assertThat(ctx.getValue().historial()).isEqualTo(historial);
        assertThat(ctx.getValue().misionesPendientes()).containsExactly(MisionGuia.RELACIONAR);
        verify(asistente, never()).responder(any(), any(), any());
        verify(cuota).registrar(anyLong());
    }
}
