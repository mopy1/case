package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.modules.chat.ia.SeniorDevConversacion.RespuestaIa;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.core.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.chat.ia.tools.SeniorDevHerramientaEjecutor;

@ExtendWith(MockitoExtension.class)
class SeniorDevConversacionTest {

    private static final Long P = 7L;
    private static final Long U = 3L;

    @Mock DeepSeekClient deepSeek;
    @Mock SeniorDevHerramientaEjecutor ejecutor;

    private SeniorDevConversacion conversacion;
    private final List<String> etiquetas = new ArrayList<>();
    private final List<DeepSeekMensaje> contexto = List.of(DeepSeekMensaje.system("sys"), DeepSeekMensaje.user("usr"));

    @BeforeEach
    void setUp() {
        conversacion = new SeniorDevConversacion(deepSeek, ejecutor);
    }

    @Test
    void sinToolCallsDevuelveElTextoDirecto() {
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt())).thenReturn(texto(" @ana, hola "));

        RespuestaIa r = responder();

        assertThat(r.texto()).isEqualTo("@ana, hola");
        assertThat(r.herramientas()).isEmpty();
        verifyNoInteractions(ejecutor);
    }

    @Test
    void unaRondaDeToolsEjecutaYDevuelveLaRespuestaFinal() {
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenReturn(pide(call("c1", "obtenerDiagrama")), texto("@ana, Pedido.nota acepta NULL"));
        when(ejecutor.etiqueta(any())).thenReturn("Revisando el diagrama…");
        when(ejecutor.ejecutar(any(), eq(P), eq(U))).thenReturn("Tabla Pedido: nota VARCHAR NULL");

        RespuestaIa r = responder();

        assertThat(r.texto()).isEqualTo("@ana, Pedido.nota acepta NULL");
        assertThat(r.herramientas()).containsExactly("obtenerDiagrama");
        assertThat(etiquetas).containsExactly("Revisando el diagrama…");
        List<DeepSeekMensaje> segunda = mensajesDeLaLlamada(2);
        assertThat(segunda).hasSize(4);
        assertThat(segunda.get(2).role()).isEqualTo("assistant");
        assertThat(segunda.get(2).content()).isEqualTo("");
        assertThat(segunda.get(3)).isEqualTo(DeepSeekMensaje.tool("c1", "Tabla Pedido: nota VARCHAR NULL"));
    }

    @Test
    void tresRondasFuerzanLaRespuestaFinalConToolChoiceNone() {
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenReturn(pide(call("a", "listarTareas")), pide(call("b", "listarNotas")), pide(call("c", "listarTareas")));
        when(deepSeek.completar(any(), any(), eq("none"), anyDouble(), anyInt())).thenReturn(texto("final"));
        when(ejecutor.ejecutar(any(), eq(P), eq(U))).thenReturn("ok");

        RespuestaIa r = responder();

        assertThat(r.texto()).isEqualTo("final");
        assertThat(r.herramientas()).containsExactly("listarTareas", "listarNotas");
        verify(deepSeek, times(3)).completar(any(), any(), eq("auto"), anyDouble(), anyInt());
        verify(deepSeek).completar(any(), notNull(), eq("none"), anyDouble(), anyInt());
    }

    @Test
    void cincoLlamadasEnUnTurnoDanCincoMensajesToolYElQuintoEsError() {
        DeepSeekToolCall[] calls = IntStream.rangeClosed(1, 5).mapToObj(i -> call("c" + i, "buscarEnHistorial"))
                .toArray(DeepSeekToolCall[]::new);
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt())).thenReturn(pide(calls), texto("listo"));
        when(ejecutor.ejecutar(any(), eq(P), eq(U))).thenReturn("Sin resultados");

        responder();

        verify(ejecutor, times(4)).ejecutar(any(), eq(P), eq(U));
        List<DeepSeekMensaje> tools = mensajesDeLaLlamada(2).stream().filter(m -> "tool".equals(m.role())).toList();
        assertThat(tools).extracting(DeepSeekMensaje::tool_call_id).containsExactly("c1", "c2", "c3", "c4", "c5");
        assertThat(tools.get(4).content()).isEqualTo("ERROR: límite de herramientas por turno");
    }

    @Test
    void error400ConToolsReintentaSinHerramientas() {
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt()))
                .thenThrow(HttpClientErrorException.create(HttpStatus.BAD_REQUEST, "Bad Request", null, null, null));
        when(deepSeek.solicitarRespuesta(eq(contexto), anyDouble(), anyInt())).thenReturn("respuesta F2");

        RespuestaIa r = responder();

        assertThat(r).isEqualTo(new RespuestaIa("respuesta F2", List.of()));
    }

    @Test
    void herramientasUsadasSinDuplicadosEnOrdenYSinNombresDesconocidos() {
        when(deepSeek.completar(any(), any(), eq("auto"), anyDouble(), anyInt())).thenReturn(
                pide(call("1", "buscarEnHistorial"), call("2", "obtenerDiagrama"), call("3", "buscarEnHistorial"),
                        call("4", "borrarTodo")), texto("ok"));
        when(ejecutor.ejecutar(any(), eq(P), eq(U))).thenReturn("r");

        assertThat(responder().herramientas()).containsExactly("buscarEnHistorial", "obtenerDiagrama");
    }

    private RespuestaIa responder() {
        return conversacion.responder(contexto, P, U, etiquetas::add);
    }

    @SuppressWarnings("unchecked")
    private List<DeepSeekMensaje> mensajesDeLaLlamada(int n) {
        ArgumentCaptor<List<DeepSeekMensaje>> captor = ArgumentCaptor.forClass(List.class);
        verify(deepSeek, atLeast(n)).completar(captor.capture(), any(), any(), anyDouble(), anyInt());
        return captor.getAllValues().get(n - 1);
    }

    private static DeepSeekMensaje texto(String t) {
        return new DeepSeekMensaje("assistant", t, null, null);
    }

    private static DeepSeekMensaje pide(DeepSeekToolCall... calls) {
        return new DeepSeekMensaje("assistant", null, List.of(calls), null);
    }

    private static DeepSeekToolCall call(String id, String nombre) {
        return new DeepSeekToolCall(id, "function", new DeepSeekToolCall.Funcion(nombre, "{}"));
    }
}
