package com.casetool.backend.core.security;

import java.io.IOException;
import java.time.Instant;

import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Sin esto, Spring Security responde 403 tanto para "sin token/token invalido"
 * como para "token valido pero sin permiso" (excepciones de negocio en
 * GlobalExceptionHandler) — el frontend no podia distinguir "cerrar sesion y
 * mandar a /login" de "mostrar el error tal cual". Este entry point solo cubre
 * el primer caso (falta de autenticacion) y responde 401.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        String body = """
                {"timestamp":"%s","status":401,"error":"Unauthorized","message":"Sesión inválida o expirada, iniciá sesión de nuevo"}""".formatted(Instant.now());

        response.getWriter().write(body);
    }
}
