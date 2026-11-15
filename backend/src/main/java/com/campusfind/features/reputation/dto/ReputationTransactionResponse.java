package com.campusfind.features.reputation.dto;

import com.campusfind.domain.reputation.ReputationTransactionType;
import java.time.Instant;
import java.util.UUID;

public record ReputationTransactionResponse(
        UUID id,
        ReputationTransactionType transactionType,
        int points,
        String description,
        Instant createdAt
) {}
