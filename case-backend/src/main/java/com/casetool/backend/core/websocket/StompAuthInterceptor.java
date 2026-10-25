package com.casetool.backend.core.websocket;

import java.security.Principal;
import java.util.Optional;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.casetool.backend.core.security.JwtService;
import com.casetool.backend.modules.chat.service.ChatDestinos;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;
import com.casetool.backend.modules.seguridad.service.UsuarioDetailsService;

/**
 * Seguridad del WebSocket por frame STOMP. Si lanza, Spring responde un frame
 * ERROR (header message = texto de la excepción) y cierra la conexión; el
 * frontend distingue por el prefijo "401"/"403".
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final String BEARER = "Bearer ";

    private final JwtService jwtService;
    private final UsuarioDetailsService usuarioDetailsService;
    private final ProyectoAccesoService accesoService;

    public StompAuthInterceptor(JwtService jwtService, UsuarioDetailsService usuarioDetailsService,
            ProyectoAccesoService accesoService) {
        this.jwtService = jwtService;
        this.usuarioDetailsService = usuarioDetailsService;
        this.accesoService = accesoService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        StompCommand comando = accessor == null ? null : accessor.getCommand();
        if (comando == null) {
            return message;
        }
        switch (comando) {
            case CONNECT, STOMP -> autenticar(accessor);
            case SUBSCRIBE -> autorizarSuscripcion(accessor);
            // Si se permitiera, cualquiera publicaría directo en /topic y podría suplantar autores
            case SEND -> throw new MessageDeliveryException("403 Los mensajes se envían por REST");
            default -> { }
        }
        return message;
    }

    /** CONNECT: el JWT va en el header nativo Authorization (no hay cookies ni query string). */
    private void autenticar(StompHeaderAccessor accessor) {
        String header = accessor.getFirstNativeHeader("Authorization");
        if (header == null || !header.startsWith(BEARER)) {
            throw new MessageDeliveryException("401 Token inválido o ausente");
        }
        String username = jwtService.validateAndExtractClaims(header.substring(BEARER.length()))
                .map(claims -> claims.getSubject())
                .orElseThrow(() -> new MessageDeliveryException("401 Token inválido o ausente"));
        try {
            UserDetails principal = usuarioDetailsService.loadUserByUsername(username);
            accessor.setUser(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        } catch (UsernameNotFoundException ex) {
            throw new MessageDeliveryException("401 Token inválido o ausente");
        }
    }

    /** SUBSCRIBE: solo a la sala de un proyecto del que el usuario es miembro. */
    private void autorizarSuscripcion(StompHeaderAccessor accessor) {
        Long proyectoId = ChatDestinos.proyectoDe(accessor.getDestination())
                .orElseThrow(() -> new MessageDeliveryException("403 Destino no permitido"));
        UsuarioPrincipal usuario = usuarioDe(accessor.getUser())
                .orElseThrow(() -> new MessageDeliveryException("401 Token inválido o ausente"));
        try {
            accesoService.verificarMiembro(proyectoId, usuario.getId());
        } catch (AccesoDenegadoProyectoException ex) {
            throw new MessageDeliveryException("403 " + ex.getMessage());
        }
    }

    /** Saca el UsuarioPrincipal que dejó el CONNECT (también lo usa ChatPresenciaListener). */
    public static Optional<UsuarioPrincipal> usuarioDe(Principal user) {
        if (user instanceof Authentication auth && auth.getPrincipal() instanceof UsuarioPrincipal p) {
            return Optional.of(p);
        }
        return Optional.empty();
    }
}
