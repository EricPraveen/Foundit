package com.campusfind.features.collection.dto;

import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import java.time.Instant;
import java.util.UUID;

public record CollectionConfirmationResponse(
        UUID collectionId,
        UUID claimId,
        UUID foundItemId,
        UUID claimantId,
        String claimantName,
        String claimantEmail,
        UUID confirmingOfficerId,
        String confirmingOfficerName,
        Instant collectedAt,
        ClaimStatus claimStatus,
        ItemAvailabilityStatus itemAvailabilityStatus,
        UUID linkedLostReportId,
        LostReportStatus lostReportStatus,
        String officerNotes,
        int pointsAwarded
) {}
