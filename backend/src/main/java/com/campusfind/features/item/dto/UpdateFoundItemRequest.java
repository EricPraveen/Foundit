package com.campusfind.features.item.dto;

import jakarta.validation.constraints.Size;
import java.util.UUID;

public record UpdateFoundItemRequest(
        @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
        String title,

        @Size(min = 5, max = 2000, message = "Description must be between 5 and 2000 characters")
        String description,

        UUID categoryId,

        UUID locationId,

        @Size(max = 255, message = "Specific location must not exceed 255 characters")
        String specificLocation
) {}
