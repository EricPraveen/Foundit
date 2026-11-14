package com.campusfind.features.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record ResendVerificationRequest(
        @NotBlank(message = "Email is required")
        String email) {}
