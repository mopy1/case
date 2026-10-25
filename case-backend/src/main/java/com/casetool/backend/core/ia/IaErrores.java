package com.casetool.backend.core.ia;

/** Traduce el error de un proveedor de IA a un motivo corto y legible para el usuario. */
public final class IaErrores {

    private static final int MOTIVO_MAX_CHARS = 160;

    private IaErrores() {
    }

    public static String motivo(Exception ex) {
        String msg = ex != null && ex.getMessage() != null ? ex.getMessage() : "";
        String min = msg.toLowerCase();
        if (min.contains("timeout") || min.contains("timed out")) return "Tiempo de espera agotado";
        if (msg.contains("401") || min.contains("unauthorized")) return "Error de autenticación con el proveedor";
        if (msg.contains("429")) return "Límite de solicitudes excedido";
        if (msg.isBlank()) return "Error del proveedor de IA";
        return msg.length() > MOTIVO_MAX_CHARS ? msg.substring(0, MOTIVO_MAX_CHARS) + "…" : msg;
    }
}
