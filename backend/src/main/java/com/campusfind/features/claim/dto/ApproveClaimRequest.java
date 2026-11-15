package com.campusfind.features.claim.dto;

import jakarta.validation.constraints.Size;

public record ApproveClaimRequest(
        @Size(max = 1000, message = "Review notes must not exceed 1000 characters")
        String reviewNotes
) {}
