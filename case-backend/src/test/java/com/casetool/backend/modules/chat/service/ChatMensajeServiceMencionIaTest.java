package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

/** La mención a @SeniorDev ya no llama a la IA directo: viaja en el evento que se procesa AFTER_COMMIT. */
@ExtendWith(MockitoExtension.class)
class ChatMensajeServiceMencionIaTest {

    private static final Long P = 7L;

    @Mock ChatMensajeRepository chatMensajeRepository;
    @Mock ProyectoRepository proyectoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock MiembroProyectoRepository miembroProyectoRepository;
    @Mock ProyectoAccesoService accesoService;
    @Mock ApplicationEventPublisher eventPublisher;
    @InjectMocks ChatMensajeService service;

    private final Proyecto proyecto = ChatFixtures.proyecto(P);
    private final Usuario adrian = ChatFixtures.usuario(3L, "adrian");

    @BeforeEach
    void setUp() {
        when(accesoService.verificarMiembro(P, 3L)).thenReturn(ChatFixtures.miembro(proyecto, adrian, MiembroProyecto.Rol.ADMIN));
        when(proyectoRepository.findById(P)).thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(adrian));
        when(chatMensajeRepository.saveAndFlush(any())).thenAnswer(inv -> {
            ChatMensaje m = inv.getArgument(0);
            m.setId(99L);
            return m;
        });
    }

    @Test
    void enviarConMencionSeniorDevPublicaEventoConMencionIa() {
        service.enviar(P, new ChatMensajeRequest("Hola @SeniorDev ayuda con normalización"), 3L);

        ChatMensajePublicadoEvent evento = capturarEvento();
        assertThat(evento.mencionaIa()).isTrue();
        assertThat(evento.mensaje().id()).isEqualTo(99L);
        assertThat(evento.mensaje().username()).isEqualTo("adrian");
        assertThat(evento.mensaje().rol()).isEqualTo(MiembroProyecto.Rol.ADMIN);
    }

    @Test
    void enviarSinMencionSeniorDevPublicaEventoSinMencionIa() {
        service.enviar(P, new ChatMensajeRequest("Mensaje común entre humanos"), 3L);

        assertThat(capturarEvento().mencionaIa()).isFalse();
    }

    private ChatMensajePublicadoEvent capturarEvento() {
        ArgumentCaptor<ChatMensajePublicadoEvent> captor = ArgumentCaptor.forClass(ChatMensajePublicadoEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        return captor.getValue();
    }
}
