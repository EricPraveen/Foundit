package com.campusfind.features.lostreport.dto;

import java.time.Instant;
import java.util.UUID;

public record LostReportAuditLogResponse(
        UUID id,
        UUID lostReportId,
        UUID actorId,
        String actorRole,
        String action,
        String previousStatus,
        String newStatus,
        String details,
        Instant createdAt
) {}
