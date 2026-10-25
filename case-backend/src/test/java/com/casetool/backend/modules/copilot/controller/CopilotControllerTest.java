package com.casetool.backend.modules.copilot.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.casetool.backend.core.exception.GlobalExceptionHandler;
import com.casetool.backend.core.ia.IaNoDisponibleException;
import com.casetool.backend.modules.copilot.dto.*;
import com.casetool.backend.modules.copilot.exception.CopilotCuotaExcedidaException;
import com.casetool.backend.modules.copilot.service.CopilotService;
import com.casetool.backend.modules.seguridad.model.Usuario;
import com.casetool.backend.modules.seguridad.model.UsuarioPrincipal;

/** Endpoint completo sin BD: binding JSON, Bean Validation, ambos modos y los códigos del handler global. */
class CopilotControllerTest {

    private static final String URL = "/api/proyectos/5/copilot/consultas";
    private final CopilotService service = mock(CopilotService.class);
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        Usuario u = new Usuario();
        u.setId(3L);
        u.setUsername("ana");
        UsuarioPrincipal principal = new UsuarioPrincipal(u);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
        mvc = MockMvcBuilders.standaloneSetup(new CopilotController(service))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private org.springframework.test.web.servlet.ResultActions enviar(String json) throws Exception {
        return mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void modoAsistenteDevuelveElTextoCrudo() throws Exception {
        when(service.consultar(eq(5L), eq(3L), eq("ana"), any()))
                .thenReturn(new CopilotConsultaResponse("CREAR_TABLA: [Libro]", OrigenRespuesta.DEEPSEEK, null));

        enviar("{\"texto\":\"Creá Libro\",\"seccion\":\"diagrama\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.texto").value("CREAR_TABLA: [Libro]"))
                .andExpect(jsonPath("$.origen").value("DEEPSEEK"));
    }

    @Test
    void modoGuiaBindeaHistorialYMisiones() throws Exception {
        when(service.consultar(anyLong(), anyLong(), any(), any()))
                .thenReturn(new CopilotConsultaResponse("1. …", OrigenRespuesta.DEEPSEEK, java.util.List.of("buscarManual")));

        enviar("""
                {"modo":"GUIA","texto":"¿N:M?","seccion":"diagrama","misionesPendientes":["RELACIONAR","EXPORTAR"],
                 "historial":[{"rol":"usuario","texto":"hola"},{"rol":"asistente","texto":"Creá dos tablas"}]}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.herramientasUsadas[0]").value("buscarManual"));

        ArgumentCaptor<CopilotConsultaRequest> req = ArgumentCaptor.forClass(CopilotConsultaRequest.class);
        verify(service).consultar(eq(5L), eq(3L), eq("ana"), req.capture());
        org.assertj.core.api.Assertions.assertThat(req.getValue().modo()).isEqualTo(ModoCopilot.GUIA);
        org.assertj.core.api.Assertions.assertThat(req.getValue().misionesPendientes())
                .containsExactly(MisionGuia.RELACIONAR, MisionGuia.EXPORTAR);
        org.assertj.core.api.Assertions.assertThat(req.getValue().historial()).hasSize(2);
    }

    @Test
    void enumDesconocidoOJsonMalFormadoDa400ConMensaje() throws Exception {
        enviar("{\"texto\":\"hola\",\"modo\":\"OTRO\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cuerpo de la petición inválido"));
        enviar("{texto").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cuerpo de la petición inválido"));
        verifyNoInteractions(service);
    }

    @Test
    void validacionDeSeccionYLargo() throws Exception {
        enviar("{\"texto\":\"hola\",\"seccion\":\"x\"}")
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("seccion: Sección inválida"));
        enviar("{\"texto\":\"" + "x".repeat(4001) + "\"}").andExpect(status().isBadRequest());
    }

    @Test
    void cuotaDa429YGeminiNoDisponible503() throws Exception {
        when(service.consultar(anyLong(), anyLong(), any(), any()))
                .thenThrow(new CopilotCuotaExcedidaException("Hiciste muchas consultas seguidas. Esperá un minuto."))
                .thenThrow(new IaNoDisponibleException("El reconocimiento de imágenes no está configurado en el servidor"));

        enviar("{\"texto\":\"hola\"}").andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));
        enviar("{\"imagenBase64\":\"QUJD\"}").andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("El reconocimiento de imágenes no está configurado en el servidor"));
    }
}
