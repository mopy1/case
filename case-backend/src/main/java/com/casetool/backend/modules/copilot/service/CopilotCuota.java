package com.casetool.backend.modules.copilot.service;

import static com.casetool.backend.modules.copilot.service.CopilotLimites.CUOTA_POR_MINUTO;
import static com.casetool.backend.modules.copilot.service.CopilotLimites.CUOTA_VENTANA_MS;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.casetool.backend.modules.copilot.exception.CopilotCuotaExcedidaException;

/**
 * Cuota por usuario con ventana deslizante de 60 s, en memoria (como la presencia): guarda la hora de
 * cada consulta y descarta las que salieron de la ventana. Se pierde al reiniciar, lo cual es aceptable.
 */
@Component
public class CopilotCuota {

    private final ConcurrentHashMap<Long, ArrayDeque<Long>> consultas = new ConcurrentHashMap<>();
    private final Clock clock;

    @Autowired
    public CopilotCuota() {
        this(Clock.systemUTC());
    }

    CopilotCuota(Clock clock) {
        this.clock = clock;
    }

    public void registrar(Long usuarioId) {
        long ahora = clock.millis();
        ArrayDeque<Long> horas = consultas.computeIfAbsent(usuarioId, k -> new ArrayDeque<>());
        synchronized (horas) {
            while (!horas.isEmpty() && ahora - horas.peekFirst() >= CUOTA_VENTANA_MS) {
                horas.pollFirst();
            }
            if (horas.size() >= CUOTA_POR_MINUTO) {
                throw new CopilotCuotaExcedidaException("Hiciste muchas consultas seguidas. Esperá un minuto.");
            }
            horas.addLast(ahora);
        }
    }
}
