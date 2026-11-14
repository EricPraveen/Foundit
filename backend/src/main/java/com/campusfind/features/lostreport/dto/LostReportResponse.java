package com.campusfind.features.lostreport.dto;

import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.category.dto.CategoryResponse;
import com.campusfind.features.location.dto.LocationResponse;
import com.campusfind.features.office.dto.SecurityOfficeResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record LostReportResponse(
        UUID id,
        String title,
        String description,
        String distinctiveFeatures,
        CategoryResponse category,
        LocationResponse location,
        String specificLocation,
        Instant lostAt,
        SecurityOfficeResponse designatedSecurityOffice,
        LostReportStatus status,
        String resolutionNotes,
        Instant resolvedAt,
        UUID resolvedByUserId,
        String cancellationReason,
        Instant cancelledAt,
        List<LostReportImageResponse> images,
        StudentContactInfo studentContact,
        Instant createdAt,
        Instant updatedAt
) {}
