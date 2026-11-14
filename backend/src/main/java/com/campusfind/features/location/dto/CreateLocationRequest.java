package com.campusfind.features.location.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLocationRequest(
        @NotBlank(message = "Location name is required")
        @Size(max = 150, message = "Location name cannot exceed 150 characters")
        String name,

        @Size(max = 100, message = "Campus zone cannot exceed 100 characters")
        String campusZone,

        String description,

        Boolean active) {}
