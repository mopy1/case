package com.casetool.backend.modules.chat.ia;

import static com.casetool.backend.modules.chat.ia.SeniorDevLimites.*;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.core.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.chat.ia.tools.SeniorDevHerramientaEjecutor;
import com.casetool.backend.modules.chat.ia.tools.SeniorDevHerramientas;

/**
 * Bucle de tool calling: el modelo pide herramientas, el backend las ejecuta y le devuelve los
 * resultados, hasta que conteste con texto. Con topes de rondas, de llamadas por ronda y de tiempo;
 * al agotarse se fuerza la respuesta final con tool_choice "none".
 */
@Component
public class SeniorDevConversacion {

    private static final Logger log = LoggerFactory.getLogger(SeniorDevConversacion.class);

    /** Texto final y herramientas efectivamente ejecutadas (sin duplicados, en orden de uso). */
    public record RespuestaIa(String texto, List<String> herramientas) {}

    private final DeepSeekClient deepSeek;
    private final SeniorDevHerramientaEjecutor ejecutor;

    public SeniorDevConversacion(DeepSeekClient deepSeek, SeniorDevHerramientaEjecutor ejecutor) {
        this.deepSeek = deepSeek;
        this.ejecutor = ejecutor;
    }

    /**
     * @param alUsarHerramienta recibe la etiqueta de cada herramienta ("Revisando el diagrama…")
     *                          para emitir un PENSANDO con detalle a la sala.
     */
    public RespuestaIa responder(List<DeepSeekMensaje> contexto, Long proyectoId, Long usuarioId,
            Consumer<String> alUsarHerramienta) {
        List<DeepSeekMensaje> mensajes = new ArrayList<>(contexto);
        Set<String> usadas = new LinkedHashSet<>();
        long inicio = System.currentTimeMillis();

        for (int ronda = 0; ronda < TOOLS_MAX_ITERACIONES; ronda++) {
            DeepSeekMensaje resp;
            try {
                resp = deepSeek.completar(List.copyOf(mensajes), SeniorDevHerramientas.DEFINICIONES, "auto", TEMPERATURA, MAX_TOKENS);
            } catch (HttpClientErrorException.BadRequest ex) {
                if (ronda > 0) throw ex;
                // A3: el proveedor rechazó las tools → comportamiento F2 (una sola llamada sin herramientas).
                log.warn("DeepSeek rechazó tools (400), reintento sin herramientas: {}", ex.getMessage());
                return new RespuestaIa(deepSeek.solicitarRespuesta(contexto, TEMPERATURA, MAX_TOKENS), List.of());
            }
            if (!resp.tieneToolCalls()) {
                return new RespuestaIa(resp.content() != null ? resp.content().trim() : "", List.copyOf(usadas));
            }
            mensajes.add(DeepSeekMensaje.asistente(resp.content(), resp.tool_calls()));
            ejecutarRonda(resp.tool_calls(), mensajes, usadas, proyectoId, usuarioId, alUsarHerramienta);
            if (System.currentTimeMillis() - inicio > DEADLINE_MS) {
                log.warn("Senior Dev superó el deadline de herramientas en proyecto {}", proyectoId);
                break;
            }
        }
        DeepSeekMensaje fin = deepSeek.completar(mensajes, SeniorDevHerramientas.DEFINICIONES, "none", TEMPERATURA, MAX_TOKENS);
        return new RespuestaIa(fin.content() != null ? fin.content().trim() : "", List.copyOf(usadas));
    }

    /** Cada tool_call_id recibe su mensaje tool (también las que pasan el tope): la API lo exige. */
    private void ejecutarRonda(List<DeepSeekToolCall> calls, List<DeepSeekMensaje> mensajes, Set<String> usadas,
            Long proyectoId, Long usuarioId, Consumer<String> alUsarHerramienta) {
        for (int i = 0; i < calls.size(); i++) {
            DeepSeekToolCall call = calls.get(i);
            String resultado;
            if (i >= TOOLS_MAX_POR_TURNO) {
                resultado = "ERROR: límite de herramientas por turno";
            } else {
                alUsarHerramienta.accept(ejecutor.etiqueta(call));
                resultado = ejecutor.ejecutar(call, proyectoId, usuarioId);
                if (SeniorDevHerramientas.NOMBRES.contains(call.nombre())) {
                    usadas.add(call.nombre());
                }
            }
            mensajes.add(DeepSeekMensaje.tool(call.id(), recortar(resultado, TOOL_RESULTADO_MAX_CHARS)));
        }
    }
}
