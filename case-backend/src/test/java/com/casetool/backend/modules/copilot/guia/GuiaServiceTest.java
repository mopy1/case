package com.casetool.backend.modules.copilot.guia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.core.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.copilot.CopilotFixtures;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.copilot.service.CopilotRespaldoManual;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

@ExtendWith(MockitoExtension.class)
class GuiaServiceTest {

    @Mock DeepSeekClient deepSeek;
    @Mock GuiaContextBuilder contextBuilder;
    @Mock GuiaHerramientaManual herramienta;
    @Mock CopilotRespaldoManual respaldo;

    private GuiaService service;
    private final GuiaContexto ctx = new GuiaContexto(5L, "ana", MiembroProyecto.Rol.ADMIN, "diagrama",
            "¿cómo relaciono?", CopilotFixtures.vacio(), null, null);

    @BeforeEach
    void setUp() {
        service = new GuiaService(deepSeek, contextBuilder, herramienta, respaldo);
    }

    private void conClave() {
        when(deepSeek.tieneApiKey()).thenReturn(true);
        when(contextBuilder.usuario(ctx)).thenReturn("CTX");
    }

    private static DeepSeekMensaje texto(String t) {
        return new DeepSeekMensaje("assistant", t, null, null);
    }

    private static DeepSeekToolCall call(String id, String nombre) {
        return new DeepSeekToolCall(id, "function", new DeepSeekToolCall.Funcion(nombre, "{\"consulta\":\"relacion\"}"));
    }

    @Test
    void sinToolCallsDevuelveElTextoSinHerramientas() {
        conClave();
        when(deepSeek.completar(any(), any(), eq("auto"), eq(0.3), eq(700))).thenReturn(texto(" Paso 1 "));

        CopilotConsultaResponse r = service.responder(ctx);

        assertThat(r).isEqualTo(new CopilotConsultaResponse("Paso 1", OrigenRespuesta.DEEPSEEK, null));
    }

    @Test
    void conToolCallEjecutaBuscarManualYCierraConNone() {
        conClave();
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenReturn(DeepSeekMensaje.asistente("", List.of(call("c1", "buscarManual"))));
        when(herramienta.ejecutar(any(), eq("diagrama"))).thenReturn("### Relaciones");
        when(deepSeek.completar(any(), any(), eq("none"), eq(0.3), eq(700))).thenReturn(texto("1. Arrastrá…\nIR_A: [diagrama]"));

        CopilotConsultaResponse r = service.responder(ctx);

        assertThat(r.herramientasUsadas()).containsExactly("buscarManual");
        assertThat(r.texto()).endsWith("IR_A: [diagrama]");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeepSeekMensaje>> msgs = ArgumentCaptor.forClass(List.class);
        verify(deepSeek).completar(msgs.capture(), any(), eq("none"), anyDouble(), anyInt());
        assertThat(msgs.getValue()).extracting(DeepSeekMensaje::role).containsExactly("system", "user", "assistant", "tool");
        assertThat(msgs.getValue().get(3)).isEqualTo(DeepSeekMensaje.tool("c1", "### Relaciones"));
    }

    @Test
    void laTerceraLlamadaRecibeErrorDeLimite() {
        conClave();
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt())).thenReturn(DeepSeekMensaje.asistente("",
                List.of(call("a", "buscarManual"), call("b", "buscarManual"), call("c", "buscarManual"))));
        when(herramienta.ejecutar(any(), any())).thenReturn("R");
        when(deepSeek.completar(any(), any(), eq("none"), anyDouble(), anyInt())).thenReturn(texto("ok"));

        service.responder(ctx);

        verify(herramienta, times(2)).ejecutar(any(), any());
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeepSeekMensaje>> msgs = ArgumentCaptor.forClass(List.class);
        verify(deepSeek).completar(msgs.capture(), any(), eq("none"), anyDouble(), anyInt());
        assertThat(msgs.getValue().get(5)).isEqualTo(DeepSeekMensaje.tool("c", "ERROR: límite de herramientas"));
    }

    @Test
    void si400ConToolsReintentaSinToolsConElManualInyectado() {
        conClave();
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenThrow(HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad", null, null, null));
        when(herramienta.buscar("¿cómo relaciono?", "diagrama")).thenReturn("### Relaciones");
        when(deepSeek.solicitarRespuesta(any(), eq(0.3), eq(700))).thenReturn("Respuesta");

        CopilotConsultaResponse r = service.responder(ctx);

        assertThat(r.texto()).isEqualTo("Respuesta");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeepSeekMensaje>> msgs = ArgumentCaptor.forClass(List.class);
        verify(deepSeek).solicitarRespuesta(msgs.capture(), anyDouble(), anyInt());
        assertThat(msgs.getValue().get(1).content()).isEqualTo("CTX\n=== MANUAL ===\n### Relaciones");
    }

    @Test
    void sinClaveRespondeElManual() {
        when(deepSeek.tieneApiKey()).thenReturn(false);
        var manual = new CopilotConsultaResponse("m", OrigenRespuesta.MANUAL, null);
        when(respaldo.responder("¿cómo relaciono?", "diagrama", "Clave de API no configurada")).thenReturn(manual);

        assertThat(service.responder(ctx)).isSameAs(manual);
        verifyNoInteractions(contextBuilder);
    }

    @Test
    void otroErrorRespondeElManualConElMotivo() {
        conClave();
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenThrow(HttpClientErrorException.create(HttpStatus.TOO_MANY_REQUESTS, "429", null, null, null));
        var manual = new CopilotConsultaResponse("m", OrigenRespuesta.MANUAL, null);
        when(respaldo.responder(any(), any(), eq("Límite de solicitudes excedido"))).thenReturn(manual);

        assertThat(service.responder(ctx)).isSameAs(manual);
    }
}
