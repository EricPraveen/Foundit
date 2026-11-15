package com.campusfind.features.claim.dto;

import com.campusfind.domain.claim.EvidenceType;
import java.time.Instant;
import java.util.UUID;

public record ClaimEvidenceResponse(
        UUID id,
        UUID claimId,
        EvidenceType evidenceType,
        String originalFilename,
        String contentType,
        long fileSize,
        Instant createdAt
) {}
