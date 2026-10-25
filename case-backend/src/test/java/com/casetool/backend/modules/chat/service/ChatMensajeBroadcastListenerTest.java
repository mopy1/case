package com.casetool.backend.modules.chat.service;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.SeniorDevService;
import com.casetool.backend.modules.chat.model.ChatMensaje;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class ChatMensajeBroadcastListenerTest {

    @Mock SimpMessagingTemplate messagingTemplate;
    @Mock SeniorDevService seniorDevService;
    @InjectMocks ChatMensajeBroadcastListener listener;

    private final ChatMensajeResponse mensaje = new ChatMensajeResponse(42L, 7L, 3L, "adrian", null,
            ChatMensaje.Tipo.USUARIO, "@SeniorDev hola", null, Instant.now(), false, null, null);

    @Test
    void difundeSiempreYDisparaIaSoloSiHayMencion() {
        listener.alConfirmar(new ChatMensajePublicadoEvent(mensaje, true));

        verify(messagingTemplate).convertAndSend("/topic/proyectos/7/chat", mensaje);
        verify(seniorDevService).procesarMencion(mensaje);
    }

    @Test
    void sinMencionSoloDifunde() {
        listener.alConfirmar(new ChatMensajePublicadoEvent(mensaje, false));

        verify(messagingTemplate).convertAndSend("/topic/proyectos/7/chat", mensaje);
        verifyNoInteractions(seniorDevService);
    }

    @Test
    void escuchaRecienDespuesDelCommit() throws NoSuchMethodException {
        TransactionalEventListener anotacion = ChatMensajeBroadcastListener.class
                .getMethod("alConfirmar", ChatMensajePublicadoEvent.class)
                .getAnnotation(TransactionalEventListener.class);

        assertThat(anotacion).isNotNull();
        assertThat(anotacion.phase()).isEqualTo(TransactionPhase.AFTER_COMMIT);
    }
}
