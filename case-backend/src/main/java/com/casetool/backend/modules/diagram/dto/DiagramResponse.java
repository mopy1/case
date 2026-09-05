package com.casetool.backend.modules.diagram.dto;

import java.util.List;

public record DiagramResponse(
        Long projectId,
        List<DiagramEntityResponse> entities,
        List<DiagramRelationResponse> relations) {
}
