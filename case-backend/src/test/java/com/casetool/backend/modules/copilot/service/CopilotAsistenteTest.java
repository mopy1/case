package com.casetool.backend.modules.copilot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.modules.copilot.CopilotFixtures;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;

@ExtendWith(MockitoExtension.class)
class CopilotAsistenteTest {

    @Mock DeepSeekClient deepSeek;
    @Mock CopilotRespaldoManual respaldo;

    private CopilotAsistente asistente;
    private final CopilotConsultaResponse manual = new CopilotConsultaResponse("manual", OrigenRespuesta.MANUAL, null);

    @BeforeEach
    void setUp() {
        asistente = new CopilotAsistente(deepSeek, respaldo);
    }

    @Test
    void armaElPromptConElDiagramaYUsaTemperatura03Y2000Tokens() {
        when(deepSeek.tieneApiKey()).thenReturn(true);
        when(deepSeek.completar(any(), isNull(), isNull(), eq(0.3), eq(2000)))
                .thenReturn(new DeepSeekMensaje("assistant", " CREAR_TABLA: [Libro] (x: 80, y: 80) ", null, null, "razono"));

        CopilotConsultaResponse r = asistente.responder("Creá Libro", "diagrama", CopilotFixtures.libroAutor());

        assertThat(r.origen()).isEqualTo(OrigenRespuesta.DEEPSEEK);
        assertThat(r.texto()).startsWith("CREAR_TABLA");
        assertThat(r.herramientasUsadas()).isNull();
        assertThat(r.razonamiento()).isEqualTo("razono");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<DeepSeekMensaje>> msgs = ArgumentCaptor.forClass(List.class);
        verify(deepSeek).completar(msgs.capture(), isNull(), isNull(), eq(0.3), eq(2000));
        assertThat(msgs.getValue()).hasSize(2);
        assertThat(msgs.getValue().get(0).content()).contains("Sección actual: \"diagrama\"", "- Libro (x:80, y:80)");
        assertThat(msgs.getValue().get(1)).isEqualTo(DeepSeekMensaje.user("Creá Libro"));
    }

    @Test
    void sinClaveRespondeElManualSinLlamarAlProveedor() {
        when(deepSeek.tieneApiKey()).thenReturn(false);
        when(respaldo.responder("hola", "diagrama", "Clave de API no configurada")).thenReturn(manual);

        assertThat(asistente.responder("hola", "diagrama", CopilotFixtures.vacio())).isSameAs(manual);
        verify(deepSeek, never()).completar(any(), any(), any(), anyDouble(), anyInt());
    }

    @Test
    void errorDelProveedorRespondeElManualConElMotivo() {
        when(deepSeek.tieneApiKey()).thenReturn(true);
        when(deepSeek.completar(any(), any(), any(), anyDouble(), anyInt())).thenThrow(new ResourceAccessException("Read timed out"));
        when(respaldo.responder("hola", "tareas", "Tiempo de espera agotado")).thenReturn(manual);

        assertThat(asistente.responder("hola", "tareas", CopilotFixtures.vacio())).isSameAs(manual);
    }
}
