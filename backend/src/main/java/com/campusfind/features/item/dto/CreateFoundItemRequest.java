package com.campusfind.features.item.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CreateFoundItemRequest(
        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
        String description,

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        @NotNull(message = "Location ID is required")
        UUID locationId,

        @Size(max = 255, message = "Specific location must not exceed 255 characters")
        String specificLocation,

        @NotNull(message = "Date and time when found is required")
        @PastOrPresent(message = "Found time cannot be in the future")
        Instant foundAt,

        @NotNull(message = "Designated Security Office ID is required")
        UUID designatedSecurityOfficeId
) {}
