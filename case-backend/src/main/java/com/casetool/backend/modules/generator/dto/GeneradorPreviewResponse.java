package com.casetool.backend.modules.generator.dto;

import java.util.List;

public record GeneradorPreviewResponse(
    String nombreProyecto,
    int totalArchivos,
    List<String> entidades,
    List<ArchivoGeneradoDto> archivos
) {}
