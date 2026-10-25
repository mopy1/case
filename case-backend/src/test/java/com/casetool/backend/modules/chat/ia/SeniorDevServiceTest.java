package com.casetool.backend.modules.chat.ia;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.casetool.backend.modules.chat.dto.ChatIaEstadoEvent;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.dto.DeepSeekChatRequest.Mensaje;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

@ExtendWith(MockitoExtension.class)
class SeniorDevServiceTest {

    private static final Long PROY_ID = 44L;
    private static final Long DISPARADOR_ID = 105L;

    @Mock ChatMensajeRepository chatRepo;
    @Mock ProyectoRepository proyectoRepo;
    @Mock SeniorDevContextBuilder contextBuilder;
    @Mock DeepSeekClient deepSeekClient;
    @Mock SimpMessagingTemplate messagingTemplate;

    private SeniorDevService service;
    private Proyecto proyecto;
    private ChatMensaje disparador;

    @BeforeEach
    void setUp() {
        service = new SeniorDevService(chatRepo, proyectoRepo, contextBuilder, deepSeekClient, messagingTemplate);
        proyecto = new Proyecto();
        proyecto.setId(PROY_ID);
        disparador = new ChatMensaje();
        disparador.setId(DISPARADOR_ID);
        disparador.setProyecto(proyecto);
        disparador.setTipo(ChatMensaje.Tipo.USUARIO);
        disparador.setContenido("Hola @SeniorDev");
    }

    @Test
    void procesarMencionExitosoGeneraMensajeIaYEventosStomp() {
        when(chatRepo.findById(DISPARADOR_ID)).thenReturn(Optional.of(disparador));
        when(contextBuilder.construirMensajes(PROY_ID, "@SeniorDev consulta"))
                .thenReturn(List.of(new Mensaje("system", "sys"), new Mensaje("user", "usr")));
        when(deepSeekClient.solicitarRespuesta(any())).thenReturn("Recomiendo 3FN.");
        when(chatRepo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        service.procesarMencion(PROY_ID, DISPARADOR_ID, "@SeniorDev consulta", 1L);

        // 1. Eventos STOMP de estado IA (PENSANDO y RESPONDIDO)
        ArgumentCaptor<ChatIaEstadoEvent> eventoCaptor = ArgumentCaptor.forClass(ChatIaEstadoEvent.class);
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/proyectos/44/chat/ia"), eventoCaptor.capture());
        List<ChatIaEstadoEvent> eventos = eventoCaptor.getAllValues();
        assertThat(eventos.get(0).estado()).isEqualTo(ChatIaEstadoEvent.Estado.PENSANDO);
        assertThat(eventos.get(0).respuestaAId()).isEqualTo(DISPARADOR_ID);
        assertThat(eventos.get(1).estado()).isEqualTo(ChatIaEstadoEvent.Estado.RESPONDIDO);
        assertThat(eventos.get(1).respuestaAId()).isEqualTo(DISPARADOR_ID);

        // 2. Persistencia mensaje IA
        ArgumentCaptor<ChatMensaje> mensajeCaptor = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(mensajeCaptor.capture());
        ChatMensaje guardado = mensajeCaptor.getValue();
        assertThat(guardado.getTipo()).isEqualTo(ChatMensaje.Tipo.IA);
        assertThat(guardado.getContenido()).isEqualTo("Recomiendo 3FN.");
        assertThat(guardado.getRespuestaA()).isEqualTo(disparador);

        // 3. Difusión STOMP chat
        verify(messagingTemplate).convertAndSend(eq("/topic/proyectos/44/chat"), any(ChatMensajeResponse.class));
    }

    @Test
    void procesarMencionConErrorDeepSeekGuardaMensajeSistemaYEmiteError() {
        when(chatRepo.findById(DISPARADOR_ID)).thenReturn(Optional.of(disparador));
        when(contextBuilder.construirMensajes(any(), any())).thenReturn(List.of());
        when(deepSeekClient.solicitarRespuesta(any())).thenThrow(new RuntimeException("Socket timeout"));
        when(deepSeekClient.tieneApiKey()).thenReturn(true);
        when(chatRepo.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));

        service.procesarMencion(PROY_ID, DISPARADOR_ID, "@SeniorDev consulta", 1L);

        ArgumentCaptor<ChatMensaje> sistemaCaptor = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(sistemaCaptor.capture());
        ChatMensaje sistema = sistemaCaptor.getValue();
        assertThat(sistema.getTipo()).isEqualTo(ChatMensaje.Tipo.SISTEMA);
        assertThat(sistema.getContenido()).contains("@SeniorDev no está disponible");
        assertThat(sistema.getRespuestaA()).isEqualTo(disparador);

        verify(messagingTemplate).convertAndSend(
                eq("/topic/proyectos/44/chat/ia"),
                eq(new ChatIaEstadoEvent(PROY_ID, ChatIaEstadoEvent.Estado.ERROR, "Tiempo de espera agotado", DISPARADOR_ID))
        );
    }
}
