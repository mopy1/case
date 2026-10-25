package com.casetool.backend.modules.chat.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.casetool.backend.core.exception.ResourceNotFoundException;
import com.casetool.backend.modules.chat.dto.ChatMensajeRequest;
import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;
import com.casetool.backend.modules.chat.ia.SeniorDevService;
import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.model.Proyecto;
import com.casetool.backend.modules.proyecto.repository.MiembroProyectoRepository;
import com.casetool.backend.modules.proyecto.repository.ProyectoRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ChatMensajeServiceTest {

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
    void recortaElLimiteEntre1y100ConDefault30() {
        assertThat(ChatMensajeService.recortarLimite(null)).isEqualTo(30);
        assertThat(ChatMensajeService.recortarLimite(500)).isEqualTo(100);
        assertThat(ChatMensajeService.recortarLimite(0)).isEqualTo(1);
        assertThat(ChatMensajeService.recortarLimite(-5)).isEqualTo(1);
        assertThat(ChatMensajeService.recortarLimite(50)).isEqualTo(50);
    }

    @Test
    void listarDevuelveOrdenAscendenteConRolActualYLimiteRecortado() {
        when(chatMensajeRepository.findByProyectoIdOrderByCreatedAtDescIdDesc(P, Limit.of(100)))
                .thenReturn(List.of(mensaje(3L), mensaje(2L), mensaje(1L)));
        when(miembroProyectoRepository.findByProyectoId(P)).thenReturn(List.of(miembro(MiembroProyecto.Rol.ADMIN)));

        List<ChatMensajeResponse> r = service.listar(P, null, 500, adrian.getId());

        assertThat(r).extracting(ChatMensajeResponse::id).containsExactly(1L, 2L, 3L);
        assertThat(r).allMatch(m -> m.rol() == MiembroProyecto.Rol.ADMIN && "adrian".equals(m.username()));
    }

    @Test
    void listarConAntesDeUsaLaConsultaDeIdsMenoresYDefault30() {
        when(chatMensajeRepository.findByProyectoIdAndIdLessThanOrderByCreatedAtDescIdDesc(P, 40L, Limit.of(30)))
                .thenReturn(List.of(mensaje(39L)));

        assertThat(service.listar(P, 40L, null, adrian.getId())).extracting(ChatMensajeResponse::id).containsExactly(39L);
        verify(chatMensajeRepository, never()).findByProyectoIdOrderByCreatedAtDescIdDesc(any(), any());
    }

    @Test
    void listarSinSerMiembroDa403YNoConsulta() {
        when(accesoService.verificarMiembro(P, 99L))
                .thenThrow(new AccesoDenegadoProyectoException("No sos colaborador de este proyecto"));

        assertThatThrownBy(() -> service.listar(P, null, null, 99L)).isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(chatMensajeRepository);
    }

    @Test
    void enviarComoLectorGuardaConStripYDifundeAlTopico() {
        when(accesoService.verificarMiembro(P, 3L)).thenReturn(miembro(MiembroProyecto.Rol.LECTOR));
        when(proyectoRepository.findById(P)).thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(adrian));
        when(chatMensajeRepository.saveAndFlush(any())).thenAnswer(inv -> {
            ChatMensaje m = inv.getArgument(0);
            m.setId(42L);
            return m;
        });

        ChatMensajeResponse r = service.enviar(P, new ChatMensajeRequest("  hola equipo \n"), 3L);

        assertThat(r.id()).isEqualTo(42L);
        assertThat(r.contenido()).isEqualTo("hola equipo");
        assertThat(r.rol()).isEqualTo(MiembroProyecto.Rol.LECTOR);
        assertThat(r.tipo()).isEqualTo(ChatMensaje.Tipo.USUARIO);
        assertThat(r.proyectoId()).isEqualTo(P);
        verify(messagingTemplate).convertAndSend("/topic/proyectos/7/chat", r);
    }

    @Test
    void enviarSinSerMiembroDa403YNoGuardaNiDifunde() {
        when(accesoService.verificarMiembro(P, 99L))
                .thenThrow(new AccesoDenegadoProyectoException("No sos colaborador de este proyecto"));

        assertThatThrownBy(() -> service.enviar(P, new ChatMensajeRequest("hola"), 99L))
                .isInstanceOf(AccesoDenegadoProyectoException.class);
        verifyNoInteractions(chatMensajeRepository, messagingTemplate);
    }

    @Test
    void enviarSoloEspaciosUnicodeDa400() {
        when(accesoService.verificarMiembro(P, 3L)).thenReturn(miembro(MiembroProyecto.Rol.ADMIN));

        assertThatThrownBy(() -> service.enviar(P, new ChatMensajeRequest("  "), 3L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("El mensaje no puede estar vacío");
        verify(chatMensajeRepository, never()).saveAndFlush(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    private ChatMensaje mensaje(Long id) {
        return ChatFixtures.mensaje(id, proyecto, adrian);
    }

    private MiembroProyecto miembro(MiembroProyecto.Rol rol) {
        return ChatFixtures.miembro(proyecto, adrian, rol);
    }
}
