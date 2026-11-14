package com.campusfind.features.item.dto;

import java.time.Instant;
import java.util.UUID;

public record HandoverLogResponse(
        UUID id,
        UUID foundItemId,
        UUID finderId,
        UUID receivingOfficerId,
        UUID securityOfficeId,
        Instant handoverConfirmedAt,
        String notes,
        Instant createdAt
) {}
