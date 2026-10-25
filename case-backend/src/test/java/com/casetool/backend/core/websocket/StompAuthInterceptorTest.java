package com.casetool.backend.core.websocket;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import com.casetool.backend.core.security.JwtService;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;
import com.casetool.backend.modules.seguridad.service.UsuarioDetailsService;

import io.jsonwebtoken.Claims;

@ExtendWith(MockitoExtension.class)
class StompAuthInterceptorTest {

    @Mock JwtService jwtService;
    @Mock UsuarioDetailsService usuarioDetailsService;
    @Mock ProyectoAccesoService accesoService;
    @InjectMocks StompAuthInterceptor interceptor;

    private final UsuarioPrincipal maria = principal(5L, "maria");

    @Test
    void connectSinTokenSeRechazaCon401() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, null), null))
                .isInstanceOf(MessageDeliveryException.class).hasMessageStartingWith("401");
        verifyNoInteractions(jwtService);
    }

    @Test
    void connectConTokenFalsoSeRechazaCon401() {
        when(jwtService.validateAndExtractClaims("falso")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, "Bearer falso"), null))
                .isInstanceOf(MessageDeliveryException.class).hasMessage("401 Token inválido o ausente");
    }

    @Test
    void connectConTokenValidoDejaElUsuarioEnLaSesion() {
        Claims claims = mock(Claims.class);
        when(claims.getSubject()).thenReturn("maria");
        when(jwtService.validateAndExtractClaims("ok")).thenReturn(Optional.of(claims));
        when(usuarioDetailsService.loadUserByUsername("maria")).thenReturn(maria);

        Message<?> msg = interceptor.preSend(frame(StompCommand.CONNECT, null, "Bearer ok"), null);

        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(msg, StompHeaderAccessor.class);
        assertThat(StompAuthInterceptor.usuarioDe(acc.getUser())).contains(maria);
    }

    @Test
    void subscribeDeNoMiembroSeRechazaCon403() {
        when(accesoService.verificarMiembro(9L, 5L))
                .thenThrow(new AccesoDenegadoProyectoException("No sos colaborador de este proyecto"));

        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, "/topic/proyectos/9/chat", null), null))
                .isInstanceOf(MessageDeliveryException.class).hasMessage("403 No sos colaborador de este proyecto");
    }

    @Test
    void subscribeAOtroDestinoSeRechazaCon403() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, "/topic/otra-cosa", null), null))
                .isInstanceOf(MessageDeliveryException.class).hasMessage("403 Destino no permitido");
        verifyNoInteractions(accesoService);
    }

    @Test
    void subscribeDeMiembroAPresenciaPasa() {
        Message<?> msg = frame(StompCommand.SUBSCRIBE, "/topic/proyectos/7/chat/presencia", null);

        assertThat(interceptor.preSend(msg, null)).isSameAs(msg);
    }

    @Test
    void sendSiempreSeRechazaCon403() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SEND, "/topic/proyectos/7/chat", null), null))
                .isInstanceOf(MessageDeliveryException.class).hasMessage("403 Los mensajes se envían por REST");
    }

    /** Frame STOMP con accessor mutable, como lo arma Spring antes del canal inbound. */
    private Message<byte[]> frame(StompCommand comando, String destino, String authorization) {
        StompHeaderAccessor acc = StompHeaderAccessor.create(comando);
        acc.setSessionId("s1");
        if (destino != null) {
            acc.setDestination(destino);
            acc.setSubscriptionId("sub-0");
        }
        if (authorization != null) {
            acc.setNativeHeader("Authorization", authorization);
        }
        if (comando != StompCommand.CONNECT) {
            acc.setUser(new UsernamePasswordAuthenticationToken(maria, null, maria.getAuthorities()));
        }
        acc.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], acc.getMessageHeaders());
    }

    private static UsuarioPrincipal principal(Long id, String username) {
        Usuario u = new Usuario();
        u.setId(id);
        u.setUsername(username);
        return new UsuarioPrincipal(u);
    }
}
