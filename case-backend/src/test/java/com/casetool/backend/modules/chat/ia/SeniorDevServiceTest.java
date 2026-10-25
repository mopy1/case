package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent;
import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent.Estado;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.SeniorDevConversacion.RespuestaIa;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

@ExtendWith(MockitoExtension.class)
class SeniorDevServiceTest {

    private static final Long P = 44L;
    private static final Long D = 105L;
    private static final String TOPIC_IA = "/topic/proyectos/44/chat/ia";

    @Mock ChatMensajeRepository chatRepo;
    @Mock ProyectoRepository proyectoRepo;
    @Mock SeniorDevContextBuilder contextBuilder;
    @Mock SeniorDevConversacion conversacion;
    @Mock SeniorDevResumidor resumidor;
    @Mock DeepSeekClient deepSeekClient;
    @Mock SimpMessagingTemplate messagingTemplate;

    private SeniorDevService service;
    private ChatMensaje disparador;
    private final ChatMensajeResponse dto = new ChatMensajeResponse(D, P, 1L, "ana", MiembroProyecto.Rol.LECTOR,
            ChatMensaje.Tipo.USUARIO, "@SeniorDev consulta", null, Instant.now(), false, null, null);

    @BeforeEach
    void setUp() {
        service = new SeniorDevService(chatRepo, proyectoRepo, contextBuilder, conversacion, resumidor,
                deepSeekClient, messagingTemplate);
        Proyecto proyecto = new Proyecto();
        proyecto.setId(P);
        disparador = new ChatMensaje();
        disparador.setId(D);
        disparador.setProyecto(proyecto);
        disparador.setTipo(ChatMensaje.Tipo.USUARIO);
        when(chatRepo.findById(D)).thenReturn(Optional.of(disparador));
        when(contextBuilder.construirMensajes(dto)).thenReturn(List.of());
    }

    @Test
    @SuppressWarnings("unchecked")
    void respondeGuardandoHerramientasEmitePensandoConDetalleYLuegoResume() {
        when(conversacion.responder(any(), eq(P), eq(1L), any())).thenAnswer(inv -> {
            inv.getArgument(3, Consumer.class).accept("Revisando el diagrama…");
            return new RespuestaIa("@ana, la nota acepta NULL", List.of("obtenerDiagrama", "buscarEnHistorial"));
        });
        when(chatRepo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        service.procesarMencion(dto);

        ArgumentCaptor<ChatIaEstadoEvent> eventos = ArgumentCaptor.forClass(ChatIaEstadoEvent.class);
        verify(messagingTemplate, times(3)).convertAndSend(eq(TOPIC_IA), eventos.capture());
        assertThat(eventos.getAllValues()).extracting(ChatIaEstadoEvent::estado)
                .containsExactly(Estado.PENSANDO, Estado.PENSANDO, Estado.RESPONDIDO);
        assertThat(eventos.getAllValues().get(1).detalle()).isEqualTo("Revisando el diagrama…");

        ArgumentCaptor<ChatMensaje> guardado = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(guardado.capture());
        assertThat(guardado.getValue().getTipo()).isEqualTo(ChatMensaje.Tipo.IA);
        assertThat(guardado.getValue().getRespuestaA()).isEqualTo(disparador);
        assertThat(guardado.getValue().getHerramientasUsadas()).isEqualTo("obtenerDiagrama,buscarEnHistorial");

        ArgumentCaptor<ChatMensajeResponse> difundido = ArgumentCaptor.forClass(ChatMensajeResponse.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/proyectos/44/chat"), difundido.capture());
        assertThat(difundido.getValue().herramientasUsadas()).containsExactly("obtenerDiagrama", "buscarEnHistorial");

        InOrder orden = inOrder(messagingTemplate, resumidor);
        orden.verify(messagingTemplate).convertAndSend(TOPIC_IA, new ChatIaEstadoEvent(P, Estado.RESPONDIDO, null, D));
        orden.verify(resumidor).actualizarSiCorresponde(P);
    }

    @Test
    void sinHerramientasGuardaNullYFalloDelResumidorNoEmiteError() {
        when(conversacion.responder(any(), any(), any(), any())).thenReturn(new RespuestaIa("ok", List.of()));
        when(chatRepo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        doThrow(new RuntimeException("DeepSeek caído")).when(resumidor).actualizarSiCorresponde(P);

        service.procesarMencion(dto);

        ArgumentCaptor<ChatMensaje> guardado = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(guardado.capture());
        assertThat(guardado.getValue().getHerramientasUsadas()).isNull();
        verify(messagingTemplate, never()).convertAndSend(eq(TOPIC_IA),
                argThat((ChatIaEstadoEvent e) -> e.estado() == Estado.ERROR));
    }

    @Test
    void errorDeDeepSeekGuardaSistemaEmiteErrorYNoResume() {
        when(conversacion.responder(any(), any(), any(), any())).thenThrow(new RuntimeException("Socket timeout"));
        when(deepSeekClient.tieneApiKey()).thenReturn(true);
        when(chatRepo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        service.procesarMencion(dto);

        ArgumentCaptor<ChatMensaje> sistema = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(sistema.capture());
        assertThat(sistema.getValue().getTipo()).isEqualTo(ChatMensaje.Tipo.SISTEMA);
        assertThat(sistema.getValue().getContenido()).contains("@SeniorDev no está disponible");
        assertThat(sistema.getValue().getRespuestaA()).isEqualTo(disparador);
        verify(messagingTemplate).convertAndSend(TOPIC_IA,
                new ChatIaEstadoEvent(P, Estado.ERROR, "Tiempo de espera agotado", D));
        verifyNoInteractions(resumidor);
    }
}
