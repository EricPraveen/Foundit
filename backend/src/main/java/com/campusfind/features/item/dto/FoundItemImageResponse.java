package com.campusfind.features.item.dto;

import java.time.Instant;
import java.util.UUID;

public record FoundItemImageResponse(
        UUID id,
        String originalFilename,
        String storagePath,
        String publicUrl,
        String contentType,
        long fileSize,
        Instant createdAt
) {}
