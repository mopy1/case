package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.SeniorDevService;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.exception.RolInsuficienteProyectoException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ChatMensajeServiceAplicarTest {
    private static final Long P = 7L;
    private static final Long M = 42L;
    private static final Long U = 3L;

    @Mock ChatMensajeRepository chatMensajeRepository;
    @Mock ProyectoRepository proyectoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock MiembroProyectoRepository miembroProyectoRepository;
    @Mock ProyectoAccesoService accesoService;
    @Mock SimpMessagingTemplate messagingTemplate;
    @Mock SeniorDevService seniorDevService;
    @InjectMocks ChatMensajeService service;

    private final Proyecto proyecto = ChatFixtures.proyecto(P);
    private final Usuario usuario = ChatFixtures.usuario(U, "adrian");

    @Test
    void aplicarPropuestaComoAdminExito() {
        MiembroProyecto admin = ChatFixtures.miembro(proyecto, usuario, MiembroProyecto.Rol.ADMIN);
        ChatMensaje mensaje = ChatFixtures.mensaje(M, proyecto, null);
        mensaje.setTipo(ChatMensaje.Tipo.IA);
        when(accesoService.verificarMiembro(P, U)).thenReturn(admin);
        when(chatMensajeRepository.findById(M)).thenReturn(Optional.of(mensaje));
        when(miembroProyectoRepository.findByProyectoId(P)).thenReturn(List.of(admin));

        ChatMensajeResponse res = service.marcarPropuestaAplicada(P, M, U);
        assertThat(res.propuestaAplicada()).isTrue();
        assertThat(res.aplicadoPor()).isEqualTo("adrian");
        assertThat(mensaje.isPropuestaAplicada()).isTrue();
        assertThat(mensaje.getAplicadoPor()).isEqualTo("adrian");
        verify(accesoService).verificarPuedeEscribir(admin);
        verify(chatMensajeRepository).saveAndFlush(mensaje);
        verify(messagingTemplate).convertAndSend(eq(ChatDestinos.topicMensajes(P)), eq(res));
    }

    @Test
    void aplicarPropuestaComoColaboradorExito() {
        Usuario maria = ChatFixtures.usuario(4L, "maria");
        MiembroProyecto colab = ChatFixtures.miembro(proyecto, maria, MiembroProyecto.Rol.COLABORADOR);
        ChatMensaje mensaje = ChatFixtures.mensaje(M, proyecto, null);
        when(accesoService.verificarMiembro(P, 4L)).thenReturn(colab);
        when(chatMensajeRepository.findById(M)).thenReturn(Optional.of(mensaje));
        when(miembroProyectoRepository.findByProyectoId(P)).thenReturn(List.of(colab));

        ChatMensajeResponse res = service.marcarPropuestaAplicada(P, M, 4L);
        assertThat(res.propuestaAplicada()).isTrue();
        assertThat(res.aplicadoPor()).isEqualTo("maria");
        verify(accesoService).verificarPuedeEscribir(colab);
        verify(chatMensajeRepository).saveAndFlush(mensaje);
        verify(messagingTemplate).convertAndSend(eq(ChatDestinos.topicMensajes(P)), eq(res));
    }

    @Test
    void aplicarPropuestaComoLectorLanzaRolInsuficiente() {
        MiembroProyecto lector = ChatFixtures.miembro(proyecto, usuario, MiembroProyecto.Rol.LECTOR);
        when(accesoService.verificarMiembro(P, U)).thenReturn(lector);
        doThrow(new RolInsuficienteProyectoException("Los lectores no pueden modificar el proyecto"))
                .when(accesoService).verificarPuedeEscribir(lector);

        assertThatThrownBy(() -> service.marcarPropuestaAplicada(P, M, U))
                .isInstanceOf(RolInsuficienteProyectoException.class);
        verify(chatMensajeRepository, never()).findById(any());
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void aplicarPropuestaNoMiembroLanzaAccesoDenegado() {
        when(accesoService.verificarMiembro(P, 99L))
                .thenThrow(new AccesoDenegadoProyectoException("No sos colaborador"));

        assertThatThrownBy(() -> service.marcarPropuestaAplicada(P, M, 99L))
                .isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(chatMensajeRepository, messagingTemplate);
    }

    @Test
    void aplicarPropuestaIdempotenteSiYaEstabaAplicada() {
        MiembroProyecto admin = ChatFixtures.miembro(proyecto, usuario, MiembroProyecto.Rol.ADMIN);
        ChatMensaje mensaje = ChatFixtures.mensaje(M, proyecto, null);
        mensaje.setPropuestaAplicada(true);
        mensaje.setAplicadoPor("usuario_previo");
        when(accesoService.verificarMiembro(P, U)).thenReturn(admin);
        when(chatMensajeRepository.findById(M)).thenReturn(Optional.of(mensaje));
        when(miembroProyectoRepository.findByProyectoId(P)).thenReturn(List.of(admin));

        ChatMensajeResponse res = service.marcarPropuestaAplicada(P, M, U);
        assertThat(res.propuestaAplicada()).isTrue();
        assertThat(res.aplicadoPor()).isEqualTo("usuario_previo");
        verify(chatMensajeRepository, never()).saveAndFlush(any());
        verify(messagingTemplate).convertAndSend(eq(ChatDestinos.topicMensajes(P)), eq(res));
    }

    @Test
    void aplicarPropuestaMensajeDeOtroProyectoLanzaIllegalArgument() {
        MiembroProyecto admin = ChatFixtures.miembro(proyecto, usuario, MiembroProyecto.Rol.ADMIN);
        ChatMensaje mensaje = ChatFixtures.mensaje(M, ChatFixtures.proyecto(88L), null);
        when(accesoService.verificarMiembro(P, U)).thenReturn(admin);
        when(chatMensajeRepository.findById(M)).thenReturn(Optional.of(mensaje));

        assertThatThrownBy(() -> service.marcarPropuestaAplicada(P, M, U))
                .isInstanceOf(IllegalArgumentException.class);
        verify(chatMensajeRepository, never()).saveAndFlush(any());
        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void aplicarPropuestaMensajeNoEncontradoLanzaResourceNotFound() {
        MiembroProyecto admin = ChatFixtures.miembro(proyecto, usuario, MiembroProyecto.Rol.ADMIN);
        when(accesoService.verificarMiembro(P, U)).thenReturn(admin);
        when(chatMensajeRepository.findById(M)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.marcarPropuestaAplicada(P, M, U))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
