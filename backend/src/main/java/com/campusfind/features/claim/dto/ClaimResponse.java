package com.campusfind.features.claim.dto;

import com.campusfind.domain.claim.ClaimStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ClaimResponse(
        UUID id,
        UUID foundItemId,
        String foundItemTitle,
        UUID designatedSecurityOfficeId,
        String designatedSecurityOfficeName,
        ClaimantSummary claimant,
        String ownershipDescription,
        ClaimStatus status,
        UUID reviewingOfficerId,
        String reviewingOfficerName,
        String reviewNotes,
        String rejectionReason,
        Instant submittedAt,
        Instant reviewedAt,
        Instant cancelledAt,
        List<ClaimEvidenceResponse> evidence,
        Instant createdAt,
        Instant updatedAt
) {}
