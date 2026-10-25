package com.casetool.backend.modules.chat.service;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Destinos STOMP del chat. Un solo lugar para armarlos y parsearlos, así el
 * interceptor, la presencia y el service no repiten strings a mano.
 */
public final class ChatDestinos {

    /** Destinos suscribibles: la sala de mensajes, su presencia y el estado de la IA. */
    private static final Pattern SALA = Pattern.compile("^/topic/proyectos/(\\d{1,18})/chat(/presencia|/ia)?$");

    private ChatDestinos() {
    }

    public static String topicMensajes(Long proyectoId) {
        return "/topic/proyectos/" + proyectoId + "/chat";
    }

    public static String topicPresencia(Long proyectoId) {
        return topicMensajes(proyectoId) + "/presencia";
    }

    public static String topicIa(Long proyectoId) {
        return topicMensajes(proyectoId) + "/ia";
    }

    /** Id del proyecto si el destino es de una sala de chat; vacío si es cualquier otro destino. */
    public static Optional<Long> proyectoDe(String destino) {
        if (destino == null) {
            return Optional.empty();
        }
        Matcher m = SALA.matcher(destino);
        return m.matches() ? Optional.of(Long.parseLong(m.group(1))) : Optional.empty();
    }

    /** Solo la suscripción a .../chat/presencia cuenta como "estar en la sala". */
    public static boolean esPresencia(String destino) {
        return proyectoDe(destino).isPresent() && destino.endsWith("/presencia");
    }
}
