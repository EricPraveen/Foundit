package com.campusfind.features.lostreport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CreateLostReportRequest(
        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 120, message = "Title must be between 3 and 120 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
        String description,

        @Size(max = 1000, message = "Distinctive features must not exceed 1000 characters")
        String distinctiveFeatures,

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        @NotNull(message = "Location ID is required")
        UUID locationId,

        @Size(max = 255, message = "Specific location must not exceed 255 characters")
        String specificLocation,

        @NotNull(message = "Lost date and time is required")
        @PastOrPresent(message = "Lost date cannot be in the future")
        Instant lostAt,

        @NotNull(message = "Designated security office ID is required")
        UUID designatedSecurityOfficeId
) {}
