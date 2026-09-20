package com.casetool.backend.modules.proyecto.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/colaboracion")
public class ColaboracionController {

    private record PresenciaItem(
            String id,
            String username,
            String color,
            Double x,
            Double y,
            Long selectedEntityId,
            long lastActive
    ) {}

    private static final Map<Long, Map<String, PresenciaItem>> PROYECTOS_PRESENCIA = new ConcurrentHashMap<>();

    @PostMapping("/presencia")
    public ResponseEntity<List<Map<String, Object>>> sincronizarPresencia(
            @PathVariable Long proyectoId,
            @RequestBody Map<String, Object> body) {

        String clientId = (String) body.get("clientId");
        if (clientId == null || clientId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String username = (String) body.getOrDefault("username", "Colaborador");
        String color = (String) body.getOrDefault("color", "#2563eb");

        Double x = 0.0;
        Double y = 0.0;
        if (body.get("cursor") instanceof Map<?, ?> c) {
            if (c.get("x") instanceof Number nx) x = nx.doubleValue();
            if (c.get("y") instanceof Number ny) y = ny.doubleValue();
        }

        Long selectedEntityId = null;
        if (body.get("selectedEntityId") instanceof Number ns) {
            selectedEntityId = ns.longValue();
        }

        long now = System.currentTimeMillis();
        Map<String, PresenciaItem> mapa = PROYECTOS_PRESENCIA.computeIfAbsent(proyectoId, k -> new ConcurrentHashMap<>());

        // Descartar sesiones anteriores con el mismo username para evitar duplicados al recargar
        mapa.entrySet().removeIf(e -> !e.getKey().equals(clientId) && e.getValue().username().equalsIgnoreCase(username));

        mapa.put(clientId, new PresenciaItem(clientId, username, color, x, y, selectedEntityId, now));

        // Purgar inactivos > 3.5 segundos
        long cutoff = now - 3500;
        mapa.entrySet().removeIf(e -> e.getValue().lastActive() < cutoff);

        List<Map<String, Object>> otros = new ArrayList<>();
        for (PresenciaItem item : mapa.values()) {
            if (!item.id().equals(clientId)) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", item.id());
                map.put("username", item.username());
                map.put("color", item.color());
                map.put("cursor", Map.of("x", item.x(), "y", item.y()));
                map.put("selectedEntityId", item.selectedEntityId());
                map.put("lastActive", item.lastActive());
                otros.add(map);
            }
        }

        return ResponseEntity.ok(otros);
    }

    @PostMapping("/desconectar")
    public ResponseEntity<Void> desconectar(
            @PathVariable Long proyectoId,
            @RequestBody Map<String, Object> body) {
        String clientId = (String) body.get("clientId");
        if (clientId != null) {
            Map<String, PresenciaItem> mapa = PROYECTOS_PRESENCIA.get(proyectoId);
            if (mapa != null) {
                mapa.remove(clientId);
            }
        }
        return ResponseEntity.ok().build();
    }
}
