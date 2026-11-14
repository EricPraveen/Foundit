package com.campusfind.features.item.dto;

import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record FoundItemResponse(
        UUID id,
        String title,
        String description,
        UUID categoryId,
        String categoryName,
        UUID locationId,
        String locationName,
        String specificLocation,
        Instant foundAt,
        UUID designatedSecurityOfficeId,
        String designatedSecurityOfficeName,
        HandoverStatus handoverStatus,
        ItemAvailabilityStatus availabilityStatus,
        UUID discoveredByUserId,
        String finderName,
        UUID receivedByOfficerId,
        String receivingOfficerName,
        Instant handoverConfirmedAt,
        String officerNotes,
        List<FoundItemImageResponse> images,
        Instant createdAt,
        Instant updatedAt
) {}
