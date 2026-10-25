package com.casetool.backend.core.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.casetool.backend.core.ia.IaNoDisponibleException;
import com.casetool.backend.modules.copilot.exception.CopilotCuotaExcedidaException;
import com.casetool.backend.modules.diagrama.exception.NombreDuplicadoDiagramaException;
import com.casetool.backend.modules.proyecto.exception.AccesoDenegadoProyectoException;
import com.casetool.backend.modules.proyecto.exception.MiembroYaExisteException;
import com.casetool.backend.modules.proyecto.exception.RolInsuficienteProyectoException;
import com.casetool.backend.modules.seguridad.exception.CredencialesInvalidasException;
import com.casetool.backend.modules.seguridad.exception.RecursoDuplicadoException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<Map<String, Object>> handleCredencialesInvalidas(CredencialesInvalidasException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body(HttpStatus.UNAUTHORIZED, ex.getMessage()));
    }

    @ExceptionHandler({RecursoDuplicadoException.class, MiembroYaExisteException.class, NombreDuplicadoDiagramaException.class})
    public ResponseEntity<Map<String, Object>> handleRecursoDuplicado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body(HttpStatus.CONFLICT, ex.getMessage()));
    }

    @ExceptionHandler({AccesoDenegadoProyectoException.class, RolInsuficienteProyectoException.class})
    public ResponseEntity<Map<String, Object>> handleAccesoDenegado(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Datos invalidos");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, message));
    }

    /** Query/path con tipo incorrecto (ej. ?limite=abc): 400 con el cuerpo estandar, no el de /error. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = ex.getName() + ": valor invalido '" + ex.getValue() + "'";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, message));
    }

    /** JSON mal formado o enum desconocido en el body: 400 con el cuerpo estandar (sin detalles de Jackson). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, "Cuerpo de la petición inválido"));
    }

    @ExceptionHandler(CopilotCuotaExcedidaException.class)
    public ResponseEntity<Map<String, Object>> handleCuota(CopilotCuotaExcedidaException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(body(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage()));
    }

    @ExceptionHandler(IaNoDisponibleException.class)
    public ResponseEntity<Map<String, Object>> handleIaNoDisponible(IaNoDisponibleException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = "No se puede completar la operación: hay otros datos que dependen de este recurso";
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body(HttpStatus.CONFLICT, message));
    }

    private Map<String, Object> body(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }
}
