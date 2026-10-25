package com.casetool.backend.modules.chat.ia.tools;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.casetool.backend.modules.chat.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;

import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class SeniorDevHerramientaEjecutorTest {

    private static final Long P = 7L;
    private static final Long U = 3L;

    @Mock HerramientasProyecto proyecto;
    @Mock HerramientaBuscarHistorial historial;

    private SeniorDevHerramientaEjecutor ejecutor;

    @BeforeEach
    void setUp() {
        ejecutor = new SeniorDevHerramientaEjecutor(proyecto, historial, JsonMapper.builder().build());
    }

    @Test
    void despachaConElProyectoDelServidorYLosArgumentosParseados() {
        when(historial.buscar(P, U, "borrado lógico", "maria", 3)).thenReturn("#12 · 2026-10-20 · maria: …");

        String r = ejecutor.ejecutar(call("buscarEnHistorial",
                "{\"consulta\":\"borrado lógico\",\"autor\":\"maria\",\"limite\":3,\"proyectoId\":999}"), P, U);

        assertThat(r).startsWith("#12");
        verify(historial).buscar(P, U, "borrado lógico", "maria", 3);
    }

    @Test
    void sinArgumentosLlamaConNulls() {
        when(proyecto.obtenerDiagrama(P, U, null)).thenReturn("Tabla Cliente: id BIGINT PK NOT NULL");

        assertThat(ejecutor.ejecutar(call("obtenerDiagrama", ""), P, U)).startsWith("Tabla Cliente");
    }

    @Test
    void nombreDesconocidoDaError() {
        assertThat(ejecutor.ejecutar(call("borrarTodo", "{}"), P, U)).isEqualTo("ERROR: herramienta desconocida 'borrarTodo'");
        verifyNoInteractions(proyecto, historial);
    }

    @Test
    void jsonInvalidoDaError() {
        assertThat(ejecutor.ejecutar(call("listarTareas", "{estado: PENDIENTE"), P, U))
                .isEqualTo("ERROR: argumentos JSON inválidos");
    }

    @Test
    void accesoDenegadoSeConvierteEnErrorSinLanzar() {
        when(proyecto.listarNotas(P, U, null, null)).thenThrow(new AccesoDenegadoProyectoException("No sos colaborador"));

        assertThat(ejecutor.ejecutar(call("listarNotas", "{}"), P, U)).isEqualTo("ERROR: No sos colaborador");
    }

    @Test
    void recortaElResultadoA6000Caracteres() {
        when(proyecto.listarTareas(any(), any(), any(), any())).thenReturn("x".repeat(10_000));

        assertThat(ejecutor.ejecutar(call("listarTareas", "{}"), P, U)).hasSize(6000);
    }

    @Test
    void etiquetaIncluyeLaConsultaDeBusqueda() {
        assertThat(ejecutor.etiqueta(call("buscarEnHistorial", "{\"consulta\":\"borrado\"}")))
                .isEqualTo("Buscando en el historial: “borrado”…");
        assertThat(ejecutor.etiqueta(call("obtenerDiagrama", "roto"))).isEqualTo("Revisando el diagrama…");
    }

    private static DeepSeekToolCall call(String nombre, String args) {
        return new DeepSeekToolCall("id1", "function", new DeepSeekToolCall.Funcion(nombre, args));
    }
}
