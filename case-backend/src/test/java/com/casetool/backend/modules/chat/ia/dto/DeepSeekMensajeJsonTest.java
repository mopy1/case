package com.casetool.backend.modules.chat.ia.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.casetool.backend.modules.chat.ia.tools.SeniorDevHerramientas;

import tools.jackson.databind.json.JsonMapper;

class DeepSeekMensajeJsonTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void serializaSinCamposNulos() {
        String json = mapper.writeValueAsString(DeepSeekMensaje.user("hola"));

        assertThat(json).isEqualTo("{\"role\":\"user\",\"content\":\"hola\"}");
        assertThat(mapper.writeValueAsString(DeepSeekMensaje.tool("call_1", "ok")))
                .contains("\"tool_call_id\":\"call_1\"").doesNotContain("tool_calls");
    }

    @Test
    void requestSinToolsNoMandaToolsNiToolChoice() {
        String json = mapper.writeValueAsString(new DeepSeekChatRequest("deepseek-chat",
                List.of(DeepSeekMensaje.system("s")), 0.5, 1200, null, null));

        assertThat(json).doesNotContain("tools").doesNotContain("tool_choice").doesNotContain("null");
    }

    @Test
    void requestConToolsSerializaElSchema() {
        String json = mapper.writeValueAsString(new DeepSeekChatRequest("deepseek-chat",
                List.of(DeepSeekMensaje.user("u")), 0.5, 1200, SeniorDevHerramientas.DEFINICIONES, "auto"));

        assertThat(json).contains("\"tool_choice\":\"auto\"").contains("\"name\":\"buscarEnHistorial\"")
                .contains("\"required\":[\"consulta\"]");
    }

    @Test
    void deserializaUnaRespuestaRealConToolCalls() {
        String respuesta = """
                {"id":"x","object":"chat.completion","choices":[{"index":0,"finish_reason":"tool_calls",
                 "message":{"role":"assistant","content":"","tool_calls":[{"index":0,"id":"call_0_abc","type":"function",
                 "function":{"name":"obtenerDiagrama","arguments":"{\\"tabla\\":\\"Pedido\\"}"}}]},"logprobs":null}],
                 "usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15,"prompt_cache_hit_tokens":0}}
                """;

        DeepSeekMensaje m = mapper.readValue(respuesta, DeepSeekChatResponse.class).mensaje();

        assertThat(m.tieneToolCalls()).isTrue();
        assertThat(m.tool_calls().get(0).id()).isEqualTo("call_0_abc");
        assertThat(m.tool_calls().get(0).nombre()).isEqualTo("obtenerDiagrama");
        assertThat(m.tool_calls().get(0).argumentos()).isEqualTo("{\"tabla\":\"Pedido\"}");
    }
}
