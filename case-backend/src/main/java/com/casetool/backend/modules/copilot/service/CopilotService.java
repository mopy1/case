package com.casetool.backend.modules.copilot.service;

import java.util.Base64;

import org.springframework.stereotype.Service;

import com.casetool.backend.modules.copilot.dto.CopilotConsultaRequest;
import com.casetool.backend.modules.copilot.dto.CopilotConsultaResponse;
import com.casetool.backend.modules.copilot.dto.ModoCopilot;
import com.casetool.backend.modules.copilot.guia.GuiaContexto;
import com.casetool.backend.modules.copilot.guia.GuiaService;
import com.casetool.backend.modules.diagrama.dto.DiagramaResponse;
import com.casetool.backend.modules.diagrama.service.DiagramaService;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

/**
 * Orquesta una consulta del Copilot personal: membresía → validaciones → cuota → diagrama → ruteo
 * (imagen = Gemini, GUIA = Guía, si no = Asistente). Sin @Transactional: la llamada a la IA puede
 * tardar decenas de segundos y no debe retener una transacción abierta.
 */
@Service
public class CopilotService {

    private final ProyectoAccesoService accesoService;
    private final DiagramaService diagramaService;
    private final CopilotCuota cuota;
    private final CopilotAsistente asistente;
    private final CopilotVision vision;
    private final GuiaService guiaService;

    public CopilotService(ProyectoAccesoService accesoService, DiagramaService diagramaService, CopilotCuota cuota,
            CopilotAsistente asistente, CopilotVision vision, GuiaService guiaService) {
        this.accesoService = accesoService;
        this.diagramaService = diagramaService;
        this.cuota = cuota;
        this.asistente = asistente;
        this.vision = vision;
        this.guiaService = guiaService;
    }

    public CopilotConsultaResponse consultar(Long proyectoId, Long usuarioId, String username, CopilotConsultaRequest req) {
        MiembroProyecto miembro = accesoService.verificarMiembro(proyectoId, usuarioId);
        String texto = req.texto() != null ? req.texto().strip() : "";
        String imagen = req.imagenBase64() != null ? req.imagenBase64().strip() : "";
        if (texto.isEmpty() && imagen.isEmpty()) {
            throw new IllegalArgumentException("Escribí una consulta o adjuntá una imagen");
        }
        ModoCopilot modo = req.modo() != null ? req.modo() : ModoCopilot.ASISTENTE;
        if (modo == ModoCopilot.GUIA && !imagen.isEmpty()) {
            throw new IllegalArgumentException("La Guía no analiza imágenes; usá el modo Asistente");
        }
        if (!imagen.isEmpty()) {
            validarBase64(imagen);
        }
        cuota.registrar(usuarioId);
        DiagramaResponse diagrama = diagramaService.obtenerDiagrama(proyectoId, usuarioId);
        String seccion = req.seccion() != null ? req.seccion() : "general";

        if (!imagen.isEmpty()) {
            return vision.responder(texto, imagen, diagrama);
        }
        if (modo == ModoCopilot.GUIA) {
            return guiaService.responder(new GuiaContexto(proyectoId, username, miembro.getRol(), seccion, texto,
                    diagrama, req.historial(), req.misionesPendientes()));
        }
        return asistente.responder(texto, seccion, diagrama);
    }

    private static void validarBase64(String imagen) {
        try {
            Base64.getDecoder().decode(imagen);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("La imagen no es válida");
        }
    }
}
