package com.casetool.backend.modules.chat.ia;

import java.util.regex.Pattern;

public final class ChatMencionIaUtils {

    private static final Pattern PATTERN_SENIOR_DEV =
            Pattern.compile("(?i)(?:^|\\s)@seniordev(?:\\b|[:.,;!?]|\\s|$)");

    private ChatMencionIaUtils() {
    }

    public static boolean contieneMencionSeniorDev(String texto) {
        if (texto == null || texto.isBlank()) {
            return false;
        }
        return PATTERN_SENIOR_DEV.matcher(texto).find();
    }

    public static boolean contieneMencionIa(String texto) {
        return contieneMencionSeniorDev(texto);
    }
}
