package com.casetool.backend.modules.chat.ia;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import com.casetool.backend.modules.chat.model.ChatMensaje;
import com.casetool.backend.modules.proyecto.model.MiembroProyecto;

/** Convierte mensajes del chat en líneas compactas para el prompt (historial y lote de resumen). */
public final class SeniorDevHistorialFormatter {

    /** Líneas de comandos que la IA emite al final: ya se mostraron como tarjeta, en el prompt sobran. */
    private static final Pattern LINEA_COMANDO = Pattern.compile(
            "(?m)^\\s*(?:[-*]\\s*)?(CREAR_TABLA|ATRIBUTOS|AGREGAR_ATRIBUTO|CREAR_RELACION|ELIMINAR_RELACION"
            + "|ELIMINAR_TABLA|CREAR_TAREA|ADR_SUGERIDA|MOTIVO|EXPORTAR_XMI|GENERAR_BACKEND|GENERAR_DDL)\\b.*$");

    private SeniorDevHistorialFormatter() {
    }

    /** {@code #140 [adrian · ADMIN]: …} / {@code #141 [Senior Dev ↳ #139]: …}, una línea por mensaje. */
    public static String historial(List<ChatMensaje> ascendente, Map<Long, MiembroProyecto.Rol> roles) {
        if (ascendente.isEmpty()) {
            return "(No hay mensajes previos en la sala)";
        }
        StringBuilder sb = new StringBuilder();
        for (ChatMensaje m : ascendente) {
            sb.append('#').append(m.getId()).append(" [").append(autor(m, roles));
            if (m.getRespuestaA() != null) {
                sb.append(" ↳ #").append(m.getRespuestaA().getId());
            }
            sb.append("]: ").append(texto(m)).append('\n');
        }
        return sb.toString().trim();
    }

    /** Lote para el resumen: {@code #id [user]: texto} (sin rol: el resumen no lo necesita). */
    public static String lote(List<ChatMensaje> ascendente) {
        StringBuilder sb = new StringBuilder();
        for (ChatMensaje m : ascendente) {
            sb.append('#').append(m.getId()).append(" [").append(autor(m, null)).append("]: ")
                    .append(texto(m)).append('\n');
        }
        return sb.toString().trim();
    }

    /** Quita comandos, aplana a una línea y recorta a {@link SeniorDevLimites#HISTORIAL_CHARS}. */
    static String texto(ChatMensaje m) {
        String contenido = m.getContenido() != null ? m.getContenido() : "";
        if (m.getTipo() == ChatMensaje.Tipo.IA) {
            contenido = LINEA_COMANDO.matcher(contenido).replaceAll("");
        }
        return SeniorDevLimites.recortar(contenido.replaceAll("\\s+", " ").trim(), SeniorDevLimites.HISTORIAL_CHARS);
    }

    private static String autor(ChatMensaje m, Map<Long, MiembroProyecto.Rol> roles) {
        if (m.getTipo() == ChatMensaje.Tipo.IA) return "Senior Dev";
        if (m.getTipo() == ChatMensaje.Tipo.SISTEMA) return "Sistema";
        String user = m.getUsuario() != null ? m.getUsuario().getUsername() : "usuario";
        if (roles == null) return user;
        MiembroProyecto.Rol rol = m.getUsuario() != null ? roles.get(m.getUsuario().getId()) : null;
        return user + " · " + (rol != null ? rol.name() : "MIEMBRO");
    }
}
