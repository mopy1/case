package com.casetool.backend.modules.copilot.guia;

import static com.casetool.backend.modules.copilot.service.CopilotLimites.*;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import com.casetool.backend.core.ia.DeepSeekClient;
import com.casetool.backend.core.ia.IaErrores;
import com.casetool.backend.core.ia.dto.DeepSeekMensaje;
import com.casetool.backend.core.ia.dto.DeepSeekTool;
import com.casetool.backend.core.ia.dto.DeepSeekToolCall;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.copilot.service.CopilotRespaldoManual;

/**
 * Modo Guía: una sola ronda de tool calling con {@code buscarManual} (máx. 2 llamadas) y la respuesta
 * final con tool_choice "none". Sin clave o con error del proveedor responde el manual (origen MANUAL).
 */
@Service
public class GuiaService {

    private static final Logger log = LoggerFactory.getLogger(GuiaService.class);
    private static final List<DeepSeekTool> TOOLS = List.of(GuiaHerramientaManual.DEFINICION);
    private static final List<String> USADAS = List.of(GuiaHerramientaManual.NOMBRE);

    private final DeepSeekClient deepSeek;
    private final GuiaContextBuilder contextBuilder;
    private final GuiaHerramientaManual herramienta;
    private final CopilotRespaldoManual respaldo;

    public GuiaService(DeepSeekClient deepSeek, GuiaContextBuilder contextBuilder, GuiaHerramientaManual herramienta,
            CopilotRespaldoManual respaldo) {
        this.deepSeek = deepSeek;
        this.contextBuilder = contextBuilder;
        this.herramienta = herramienta;
        this.respaldo = respaldo;
    }

    public CopilotConsultaResponse responder(GuiaContexto ctx) {
        if (!deepSeek.tieneApiKey()) {
            return respaldo.responder(ctx.pregunta(), ctx.seccion(), "Clave de API no configurada");
        }
        String usuario = contextBuilder.usuario(ctx);
        try {
            List<DeepSeekMensaje> mensajes = new ArrayList<>(List.of(DeepSeekMensaje.system(GuiaPrompts.SYSTEM),
                    DeepSeekMensaje.user(usuario)));
            DeepSeekMensaje r1;
            try {
                r1 = deepSeek.completar(List.copyOf(mensajes), TOOLS, "auto", GUIA_TEMPERATURA, GUIA_MAX_TOKENS);
            } catch (HttpClientErrorException.BadRequest ex) {
                log.warn("DeepSeek rechazó buscarManual (400), reintento con el manual inyectado: {}", ex.getMessage());
                return sinHerramientas(ctx, usuario);
            }
            if (!r1.tieneToolCalls()) {
                return new CopilotConsultaResponse(texto(r1), OrigenRespuesta.DEEPSEEK, null);
            }
            mensajes.add(DeepSeekMensaje.asistente(r1.content(), r1.tool_calls()));
            boolean usoManual = ejecutarRonda(r1.tool_calls(), ctx.seccion(), mensajes);
            DeepSeekMensaje r2 = deepSeek.completar(mensajes, TOOLS, "none", GUIA_TEMPERATURA, GUIA_MAX_TOKENS);
            return new CopilotConsultaResponse(texto(r2), OrigenRespuesta.DEEPSEEK, usoManual ? USADAS : null);
        } catch (Exception ex) {
            log.warn("La Guía no pudo consultar a DeepSeek en proyecto {}: {}", ctx.proyectoId(), ex.getMessage());
            return respaldo.responder(ctx.pregunta(), ctx.seccion(), IaErrores.motivo(ex));
        }
    }

    /** Cada tool_call_id recibe su mensaje tool (la API lo exige), también las que pasan el tope. */
    private boolean ejecutarRonda(List<DeepSeekToolCall> calls, String seccion, List<DeepSeekMensaje> mensajes) {
        boolean usoManual = false;
        for (int i = 0; i < calls.size(); i++) {
            DeepSeekToolCall call = calls.get(i);
            String resultado;
            if (i < GUIA_MAX_TOOL_CALLS && GuiaHerramientaManual.NOMBRE.equals(call.nombre())) {
                resultado = herramienta.ejecutar(call, seccion);
                usoManual = true;
            } else {
                resultado = "ERROR: límite de herramientas";
            }
            mensajes.add(DeepSeekMensaje.tool(call.id(), resultado));
        }
        return usoManual;
    }

    /** El proveedor rechazó las tools: una llamada sin ellas con los 2 mejores temas al final del mensaje. */
    private CopilotConsultaResponse sinHerramientas(GuiaContexto ctx, String usuario) {
        String conManual = usuario + "\n=== MANUAL ===\n" + herramienta.buscar(ctx.pregunta(), ctx.seccion());
        String r = deepSeek.solicitarRespuesta(List.of(DeepSeekMensaje.system(GuiaPrompts.SYSTEM),
                DeepSeekMensaje.user(conManual)), GUIA_TEMPERATURA, GUIA_MAX_TOKENS);
        return new CopilotConsultaResponse(r, OrigenRespuesta.DEEPSEEK, USADAS);
    }

    private static String texto(DeepSeekMensaje m) {
        return m.content() != null ? m.content().trim() : "";
    }
}
