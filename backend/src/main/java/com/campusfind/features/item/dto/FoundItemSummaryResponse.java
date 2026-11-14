package com.campusfind.features.item.dto;

import com.campusfind.domain.item.ItemAvailabilityStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FoundItemSummaryResponse(
        UUID id,
        String title,
        String description,
        UUID categoryId,
        String categoryName,
        UUID locationId,
        String locationName,
        String specificLocation,
        Instant foundAt,
        ItemAvailabilityStatus availabilityStatus,
        List<String> imageUrls,
        Instant createdAt
) {}
