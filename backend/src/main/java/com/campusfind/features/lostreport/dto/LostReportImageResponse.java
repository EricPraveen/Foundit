package com.campusfind.features.lostreport.dto;

import java.time.Instant;
import java.util.UUID;

public record LostReportImageResponse(
        UUID id,
        String originalFilename,
        String publicUrl,
        String contentType,
        long fileSize,
        Instant createdAt
) {}
