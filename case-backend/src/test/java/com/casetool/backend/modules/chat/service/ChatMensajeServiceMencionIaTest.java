package com.casetool.backend.modules.chat.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;
import com.casetool.backend.modules.chat.ia.SeniorDevService;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ChatMensajeServiceMencionIaTest {

    private static final Long P = 7L;

    @Mock ChatMensajeRepository chatMensajeRepository;
    @Mock ProyectoRepository proyectoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock MiembroProyectoRepository miembroProyectoRepository;
    @Mock ProyectoAccesoService accesoService;
    @Mock SimpMessagingTemplate messagingTemplate;
    @Mock SeniorDevService seniorDevService;
    @InjectMocks ChatMensajeService service;

    private final Proyecto proyecto = ChatFixtures.proyecto(P);
    private final Usuario adrian = ChatFixtures.usuario(3L, "adrian");

    @Test
    void enviarConMencionSeniorDevDisparaProcesamientoAsincrono() {
        when(accesoService.verificarMiembro(P, 3L)).thenReturn(miembro(MiembroProyecto.Rol.ADMIN));
        when(proyectoRepository.findById(P)).thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(adrian));
        when(chatMensajeRepository.saveAndFlush(any())).thenAnswer(inv -> {
            ChatMensaje m = inv.getArgument(0);
            m.setId(99L);
            return m;
        });

        service.enviar(P, new ChatMensajeRequest("Hola @SeniorDev ayuda con normalización"), 3L);

        verify(seniorDevService).procesarMencion(P, 99L, "Hola @SeniorDev ayuda con normalización", 3L);
    }

    @Test
    void enviarSinMencionSeniorDevNoInvocaSeniorDevService() {
        when(accesoService.verificarMiembro(P, 3L)).thenReturn(miembro(MiembroProyecto.Rol.ADMIN));
        when(proyectoRepository.findById(P)).thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(adrian));
        when(chatMensajeRepository.saveAndFlush(any())).thenAnswer(inv -> {
            ChatMensaje m = inv.getArgument(0);
            m.setId(100L);
            return m;
        });

        service.enviar(P, new ChatMensajeRequest("Mensaje común entre humanos"), 3L);

        verifyNoInteractions(seniorDevService);
    }

    private MiembroProyecto miembro(MiembroProyecto.Rol rol) {
        return ChatFixtures.miembro(proyecto, adrian, rol);
    }
}
