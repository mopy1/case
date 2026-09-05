package com.casetool.backend.modules.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max = 150) String name,
        @Size(max = 1000) String description) {
}
