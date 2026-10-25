package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;

class ChatAvisoSistemaServiceTest {

    private final ChatMensajeRepository chatRepo = mock(ChatMensajeRepository.class);
    private final ProyectoRepository proyectoRepo = mock(ProyectoRepository.class);
    private final ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
    private final ChatAvisoSistemaService service = new ChatAvisoSistemaService(chatRepo, proyectoRepo, publisher);

    @Test
    void guardaUnMensajeSistemaSinAutorYPublicaElEventoDeDifusion() {
        when(proyectoRepo.getReferenceById(5L)).thenReturn(ChatFixtures.proyecto(5L));

        ChatMensajeResponse r = service.publicar(5L, "@ana se unió");

        ArgumentCaptor<ChatMensaje> m = ArgumentCaptor.forClass(ChatMensaje.class);
        verify(chatRepo).saveAndFlush(m.capture());
        assertThat(m.getValue().getTipo()).isEqualTo(ChatMensaje.Tipo.SISTEMA);
        assertThat(m.getValue().getUsuario()).isNull();
        assertThat(m.getValue().getRespuestaA()).isNull();
        assertThat(r.contenido()).isEqualTo("@ana se unió");
        assertThat(r.proyectoId()).isEqualTo(5L);
        verify(publisher).publishEvent(new ChatMensajePublicadoEvent(r, false));
    }
}
