package com.casetool.backend.modules.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.casetool.backend.modules.chat.model.ChatMemoria;

public interface ChatMemoriaRepository extends JpaRepository<ChatMemoria, Long> {
}
