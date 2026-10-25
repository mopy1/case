package com.casetool.backend.modules.chat.ia.tools;

import static com.casetool.backend.modules.chat.ia.SeniorDevLimites.*;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.chat.repository.ChatMensajeRepository;
import com.casetool.backend.modules.proyecto.service.ProyectoAccesoService;

/** buscarEnHistorial: full-text en español sobre TODO el chat del proyecto (memoria lejana, capa 4). */
@Component
@Transactional(readOnly = true)
public class HerramientaBuscarHistorial {

    private static final DateTimeFormatter FECHA = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneOffset.UTC);

    private final ProyectoAccesoService accesoService;
    private final ChatMensajeRepository chatRepo;

    public HerramientaBuscarHistorial(ProyectoAccesoService accesoService, ChatMensajeRepository chatRepo) {
        this.accesoService = accesoService;
        this.chatRepo = chatRepo;
    }

    /** {@code #12 · 2026-10-20 · maria: extracto…} o {@code Sin resultados para "…"}. */
    public String buscar(Long proyectoId, Long usuarioId, String consulta, String autor, Integer limite) {
        accesoService.verificarMiembro(proyectoId, usuarioId);
        String q = consulta != null ? consulta.strip() : "";
        if (q.isEmpty()) {
            return "ERROR: falta la consulta";
        }
        q = q.length() > BUSQUEDA_CONSULTA_MAX_CHARS ? q.substring(0, BUSQUEDA_CONSULTA_MAX_CHARS) : q;
        String quien = autor != null ? autor.strip().replaceFirst("^@", "") : "";
        int lim = acotar(limite, BUSQUEDA_LIMITE_DEFAULT, 1, BUSQUEDA_LIMITE_MAX);

        List<ChatMensaje> encontrados = chatRepo.buscarTextoCompleto(proyectoId, alMenosUna(q), quien, lim);
        if (encontrados.isEmpty()) {
            return "Sin resultados para \"" + q + "\"";
        }
        return encontrados.stream().map(HerramientaBuscarHistorial::linea).collect(Collectors.joining("\n"));
    }

    /**
     * websearch_to_tsquery une las palabras con AND: "borrado lógico cliente baja" no encuentra un mensaje
     * que no diga "baja". El modelo manda varias palabras clave, así que basta con que aparezca una
     * (OR); ts_rank deja primero los mensajes que tienen más.
     */
    static String alMenosUna(String consulta) {
        return Arrays.stream(consulta.replace("\"", " ").split("\\s+"))
                .map(p -> p.replaceFirst("^-+", ""))
                .filter(p -> !p.isBlank() && !p.equalsIgnoreCase("or"))
                .collect(Collectors.joining(" or "));
    }

    private static String linea(ChatMensaje m) {
        String autor = m.getTipo() == ChatMensaje.Tipo.IA ? "Senior Dev"
                : m.getUsuario() != null ? m.getUsuario().getUsername() : "usuario";
        String fecha = m.getCreatedAt() != null ? FECHA.format(m.getCreatedAt()) : "s/f";
        String extracto = recortar(m.getContenido().replaceAll("\\s+", " ").trim(), BUSQUEDA_EXTRACTO_CHARS);
        return "#" + m.getId() + " · " + fecha + " · " + autor + ": " + extracto;
    }
}
