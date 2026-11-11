package com.casetool.backend.core.ia.motor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.ResourceAccessException;

import com.casetool.backend.core.ia.dto.DeepSeekChatRequest;
import com.casetool.backend.core.ia.dto.DeepSeekChatResponse;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;

@ExtendWith(MockitoExtension.class)
class MotorIaRouterTest {

    private static final String URL = "https://abc.ngrok-free.dev/v1";
    private static final DeepSeekChatRequest REQ = new DeepSeekChatRequest("deepseek-chat",
            List.of(DeepSeekMensaje.user("hola")), 0.3, 700, null, null);
    private static final DeepSeekMensaje DE_DEEPSEEK = DeepSeekMensaje.asistente("de DeepSeek", null);

    @Mock KaggleLlamaClient kaggle;
    @Mock Supplier<DeepSeekMensaje> deepSeek;

    private static DeepSeekChatResponse respuesta(String content) {
        return new DeepSeekChatResponse("x", List.of(new DeepSeekChatResponse.Choice(0,
                new DeepSeekMensaje("assistant", content, null, null, null), "stop")), null);
    }

    private MotorIaRouter router() {
        return new MotorIaRouter(kaggle);
    }

    @Test
    void kaggleFallaYCaeADeepSeekSinVolverAProbarloEnElMismoPedido() {
        when(kaggle.completar(eq(URL), any())).thenThrow(new ResourceAccessException("Read timed out"));
        when(deepSeek.get()).thenReturn(DE_DEEPSEEK);

        MotorIaContexto.ejecutarCon(URL, () -> {
            assertThat(router().completar(REQ, true, deepSeek)).isSameAs(DE_DEEPSEEK);
            assertThat(MotorIaContexto.motorUsado()).isEqualTo(MotorIa.DEEPSEEK);
            router().completar(REQ, true, deepSeek);
            return null;
        });

        verify(kaggle, times(1)).completar(any(), any());
        verify(deepSeek, times(2)).get();
    }

    @Test
    void kaggleRespondeConRazonamientoYMarcaQwen() {
        when(kaggle.completar(eq(URL), any())).thenReturn(respuesta("<think>analizo</think>Listo"));

        DeepSeekMensaje m = MotorIaContexto.ejecutarCon(URL, () -> {
            DeepSeekMensaje r = router().completar(REQ, true, deepSeek);
            assertThat(MotorIaContexto.motorUsado()).isEqualTo(MotorIa.QWEN_KAGGLE);
            return r;
        });

        assertThat(m.content()).isEqualTo("Listo");
        assertThat(m.reasoning_content()).isEqualTo("analizo");
        verifyNoInteractions(deepSeek);
        assertThat(MotorIaContexto.urlKaggle()).isNull();
    }

    @Test
    void respuestaVaciaDeKaggleTambienCaeADeepSeek() {
        when(kaggle.completar(eq(URL), any())).thenReturn(respuesta("<think>sin tokens"));
        when(deepSeek.get()).thenReturn(DE_DEEPSEEK);

        assertThat(MotorIaContexto.ejecutarCon(URL, () -> router().completar(REQ, true, deepSeek))).isSameAs(DE_DEEPSEEK);
    }

    @Test
    void sinClaveDeDeepSeekRelanzaElErrorDeKaggle() {
        when(kaggle.completar(eq(URL), any())).thenThrow(new ResourceAccessException("Read timed out"));

        assertThatThrownBy(() -> MotorIaContexto.ejecutarCon(URL, () -> router().completar(REQ, false, deepSeek)))
                .isInstanceOf(ResourceAccessException.class);
        verifyNoInteractions(deepSeek);
    }

    @Test
    void sinContextoVaDirectoADeepSeek() {
        when(deepSeek.get()).thenReturn(DE_DEEPSEEK);

        assertThat(router().completar(REQ, true, deepSeek)).isSameAs(DE_DEEPSEEK);
        verifyNoInteractions(kaggle);
    }
}
