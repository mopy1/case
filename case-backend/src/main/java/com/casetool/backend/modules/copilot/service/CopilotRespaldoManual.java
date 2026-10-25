package com.casetool.backend.modules.copilot.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.OrigenRespuesta;
import com.casetool.backend.modules.copilot.guia.ManualBuscador;
import com.casetool.backend.modules.copilot.guia.ManualRepositorio;
import com.casetool.backend.modules.copilot.guia.ManualTema;

/** Sin IA (sin clave o proveedor caído) el Copilot sigue siendo útil: responde con el tema del manual. */
@Component
public class CopilotRespaldoManual {

    private final ManualBuscador buscador;
    private final ManualRepositorio repositorio;

    public CopilotRespaldoManual(ManualBuscador buscador, ManualRepositorio repositorio) {
        this.buscador = buscador;
        this.repositorio = repositorio;
    }

    public CopilotConsultaResponse responder(String consulta, String seccion, String motivo) {
        String aviso = "_El asistente IA no está disponible ahora (" + motivo + "). Te muestro lo que dice el manual._\n\n";
        List<ManualTema> encontrados = buscador.buscar(consulta, seccion, 1);
        if (encontrados.isEmpty()) {
            return manual(aviso + "Puedo explicarte: " + titulos(seccion) + ".");
        }
        ManualTema t = encontrados.get(0);
        StringBuilder sb = new StringBuilder(aviso).append("### ").append(t.titulo()).append("\n\n").append(t.contenido());
        if (t.adrSugerida() != null) {
            sb.append("\n\nADR_SUGERIDA: [").append(t.adrSugerida().accion())
                    .append("]\nMOTIVO: [").append(t.adrSugerida().motivo()).append(']');
        }
        return manual(sb.toString());
    }

    /** Títulos de la sección actual (o de todo el manual si la sección no tiene temas). */
    private String titulos(String seccion) {
        List<ManualTema> deSeccion = repositorio.temas().stream().filter(t -> t.seccion().equals(seccion)).toList();
        return (deSeccion.isEmpty() ? repositorio.temas() : deSeccion).stream()
                .map(ManualTema::titulo).collect(Collectors.joining("; "));
    }

    private static CopilotConsultaResponse manual(String texto) {
        return new CopilotConsultaResponse(texto, OrigenRespuesta.MANUAL, null);
    }
}
