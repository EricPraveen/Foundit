package com.campusfind.features.claim.dto;

import java.util.UUID;

public record ClaimantSummary(
        UUID id,
        String fullName,
        String email,
        String phoneNumber,
        String indexNumber
) {}
