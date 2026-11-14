package com.campusfind.features.lostreport.dto;

import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record UpdateLostReportRequest(
        @Size(min = 3, max = 120, message = "Title must be between 3 and 120 characters")
        String title,

        @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
        String description,

        @Size(max = 1000, message = "Distinctive features must not exceed 1000 characters")
        String distinctiveFeatures,

        UUID categoryId,

        UUID locationId,

        @Size(max = 255, message = "Specific location must not exceed 255 characters")
        String specificLocation,

        @PastOrPresent(message = "Lost date cannot be in the future")
        Instant lostAt
) {}
