package com.campusfind.features.lostreport.dto;

import com.campusfind.domain.lostreport.LostReportStatus;
import java.time.Instant;
import java.util.UUID;

public record LostReportSummaryResponse(
        UUID id,
        String title,
        String categoryName,
        String locationName,
        Instant lostAt,
        LostReportStatus status,
        Instant createdAt
) {}
