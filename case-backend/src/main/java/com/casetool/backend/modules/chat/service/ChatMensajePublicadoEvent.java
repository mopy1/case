package com.casetool.backend.modules.chat.service;

import com.casetool.backend.modules.chat.dto.ChatMensajeResponse;

/** Se publica dentro de la transacción; el listener lo procesa recién después del commit. */
public record ChatMensajePublicadoEvent(ChatMensajeResponse mensaje, boolean mencionaIa) {
}
