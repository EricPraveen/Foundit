package com.campusfind.features.office.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSecurityOfficeRequest(
        @NotBlank(message = "Office name is required")
        @Size(max = 150, message = "Office name cannot exceed 150 characters")
        String name,

        @NotBlank(message = "Campus location is required")
        @Size(max = 200, message = "Campus location cannot exceed 200 characters")
        String campusLocation,

        @Size(max = 255, message = "Contact email cannot exceed 255 characters")
        String contactEmail,

        @Size(max = 50, message = "Contact phone cannot exceed 50 characters")
        String contactPhone,

        @Size(max = 255, message = "Operating hours cannot exceed 255 characters")
        String operatingHours) {}
