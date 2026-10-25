package com.casetool.backend.modules.chat.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Crea el índice GIN full-text de chat_mensajes, que JPA no puede expresar. Corre después de que
 * Hibernate actualizó el esquema, es idempotente (IF NOT EXISTS) y si falla solo avisa: la búsqueda
 * de Senior Dev sigue funcionando, solo que sin índice.
 */
@Component
public class ChatBusquedaIndiceInitializer implements ApplicationRunner {

    static final String SQL = "CREATE INDEX IF NOT EXISTS idx_chat_mensajes_fts "
            + "ON chat_mensajes USING GIN (to_tsvector('spanish', contenido))";

    private static final Logger log = LoggerFactory.getLogger(ChatBusquedaIndiceInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public ChatBusquedaIndiceInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(SQL);
            log.info("Índice full-text idx_chat_mensajes_fts verificado");
        } catch (Exception ex) {
            log.warn("No se pudo crear el índice full-text del chat: {}", ex.getMessage());
        }
    }
}
