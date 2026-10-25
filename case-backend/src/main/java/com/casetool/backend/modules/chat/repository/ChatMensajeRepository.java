package com.casetool.backend.modules.chat.repository;

import java.util.List;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.casetool.backend.modules.chat.model.ChatMensaje;

public interface ChatMensajeRepository extends JpaRepository<ChatMensaje, Long> {

  /** Los más recientes primero; el service invierte el orden. */
  @EntityGraph(attributePaths = {"usuario"})
  List<ChatMensaje> findByProyectoIdOrderByCreatedAtDescIdDesc(Long proyectoId, Limit limit);

  /** Página anterior: solo ids menores al más viejo que ya tiene el cliente. */
  @EntityGraph(attributePaths = {"usuario"})
  List<ChatMensaje> findByProyectoIdAndIdLessThanOrderByCreatedAtDescIdDesc(Long proyectoId, Long antesDe, Limit limit);

  /** Mensajes pendientes de resumir: entre la marca de agua (excluida) y el corte (excluido). */
  long countByProyectoIdAndIdGreaterThanAndIdLessThan(Long proyectoId, Long desde, Long hasta);

  /** Lote a resumir, del más viejo al más nuevo. */
  @EntityGraph(attributePaths = {"usuario"})
  List<ChatMensaje> findByProyectoIdAndIdGreaterThanAndIdLessThanOrderByIdAsc(
      Long proyectoId, Long desde, Long hasta, Limit limit);

  /**
   * Full-text en español sobre todo el chat del proyecto. La expresión to_tsvector es idéntica a la
   * del índice GIN idx_chat_mensajes_fts; websearch_to_tsquery nunca falla con texto libre.
   * {@code autor} vacío = sin filtro (un NULL en parámetro nativo de Postgres no tiene tipo).
   */
  @Query(value = """
      SELECT m.* FROM chat_mensajes m LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.proyecto_id = :proyectoId AND m.tipo <> 'SISTEMA'
        AND to_tsvector('spanish', m.contenido) @@ websearch_to_tsquery('spanish', :consulta)
        AND (:autor = '' OR lower(u.username) = lower(:autor))
      ORDER BY ts_rank(to_tsvector('spanish', m.contenido), websearch_to_tsquery('spanish', :consulta)) DESC, m.id DESC
      LIMIT :limite
      """, nativeQuery = true)
  List<ChatMensaje> buscarTextoCompleto(@Param("proyectoId") Long proyectoId, @Param("consulta") String consulta,
      @Param("autor") String autor, @Param("limite") int limite);
}
