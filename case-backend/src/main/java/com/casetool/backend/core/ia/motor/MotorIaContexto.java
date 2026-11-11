package com.casetool.backend.core.ia.motor;

import java.util.function.Supplier;

/**
 * Motor activo del pedido en curso (ThreadLocal): la URL de Kaggle a probar primero y el motor que
 * efectivamente respondió. Lo fijan Copilot y Senior Dev con {@link #ejecutarCon}; sin contexto todo va a DeepSeek.
 */
public final class MotorIaContexto {

    private static final class Estado {
        private String urlKaggle;
        private MotorIa motorUsado;
    }

    private static final ThreadLocal<Estado> ACTUAL = new ThreadLocal<>();

    private MotorIaContexto() {
    }

    /** Corre {@code accion} con la URL dada (null = solo DeepSeek) y limpia el hilo al terminar. */
    public static <T> T ejecutarCon(String urlKaggle, Supplier<T> accion) {
        Estado previo = ACTUAL.get();
        Estado estado = new Estado();
        estado.urlKaggle = urlKaggle;
        ACTUAL.set(estado);
        try {
            return accion.get();
        } finally {
            if (previo == null) ACTUAL.remove();
            else ACTUAL.set(previo);
        }
    }

    /** URL de Kaggle vigente, o null si no hay contexto, no se eligió Kaggle o ya falló en este pedido. */
    public static String urlKaggle() {
        Estado e = ACTUAL.get();
        return e != null ? e.urlKaggle : null;
    }

    /** Motor de la última respuesta del pedido; DEEPSEEK si todavía no respondió ninguno. */
    public static MotorIa motorUsado() {
        Estado e = ACTUAL.get();
        return e != null && e.motorUsado != null ? e.motorUsado : MotorIa.DEEPSEEK;
    }

    static void marcarUsado(MotorIa motor) {
        Estado e = ACTUAL.get();
        if (e != null) e.motorUsado = motor;
    }

    /** Kaggle falló: el resto del pedido (otras rondas del bucle) va directo a DeepSeek sin volver a esperar. */
    static void descartarKaggle() {
        Estado e = ACTUAL.get();
        if (e != null) e.urlKaggle = null;
    }
}
