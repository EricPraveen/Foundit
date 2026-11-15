package com.campusfind.features.reputation.dto;

import java.util.UUID;

public record ReputationBalanceResponse(
        UUID userId,
        int currentBalance,
        int totalEarned,
        long totalTransactions
) {}
