package com.campusfind.features.claim.dto;

import com.campusfind.domain.claim.ClaimStatus;
import java.time.Instant;
import java.util.UUID;

public record ClaimSummaryResponse(
        UUID id,
        UUID foundItemId,
        String foundItemTitle,
        ClaimStatus status,
        Instant submittedAt,
        Instant reviewedAt
) {}
