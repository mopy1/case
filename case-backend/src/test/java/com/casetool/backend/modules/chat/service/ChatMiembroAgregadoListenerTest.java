package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.MiembroAgregadoEvent;

class ChatMiembroAgregadoListenerTest {

    private final ChatAvisoSistemaService aviso = mock(ChatAvisoSistemaService.class);
    private final ChatMiembroAgregadoListener listener = new ChatMiembroAgregadoListener(aviso);

    @Test
    void publicaElAvisoConElRolLegible() {
        listener.alAgregarMiembro(new MiembroAgregadoEvent(5L, "ana", MiembroProyecto.Rol.COLABORADOR));

        verify(aviso).publicar(5L,
                "@ana se unió al proyecto como Colaborador. Para arrancar, abrí la Guía del Copilot › Primeros pasos.");
    }

    @Test
    void rolesLegibles() {
        assertThat(ChatMiembroAgregadoListener.rolLegible(MiembroProyecto.Rol.ADMIN)).isEqualTo("Administrador");
        assertThat(ChatMiembroAgregadoListener.rolLegible(MiembroProyecto.Rol.LECTOR)).isEqualTo("Lector");
    }

    @Test
    void siElAvisoFallaNoPropagaLaExcepcion() {
        when(aviso.publicar(anyLong(), anyString())).thenThrow(new RuntimeException("BD caída"));

        assertThatCode(() -> listener.alAgregarMiembro(new MiembroAgregadoEvent(5L, "ana", MiembroProyecto.Rol.LECTOR)))
                .doesNotThrowAnyException();
    }

    @Test
    void escuchaRecienDespuesDelCommitYElAvisoVaEnTransaccionNueva() throws Exception {
        var metodo = ChatMiembroAgregadoListener.class.getMethod("alAgregarMiembro", MiembroAgregadoEvent.class);
        assertThat(metodo.getAnnotation(TransactionalEventListener.class).phase()).isEqualTo(TransactionPhase.AFTER_COMMIT);

        var publicar = ChatAvisoSistemaService.class.getMethod("publicar", Long.class, String.class);
        assertThat(publicar.getAnnotation(Transactional.class).propagation())
                .isEqualTo(org.springframework.transaction.annotation.Propagation.REQUIRES_NEW);
    }
}
