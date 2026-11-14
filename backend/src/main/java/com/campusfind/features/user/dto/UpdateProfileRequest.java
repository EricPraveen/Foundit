package com.campusfind.features.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Full name cannot be blank")
        @Size(max = 150, message = "Full name cannot exceed 150 characters")
        String fullName,

        @Size(max = 30, message = "Phone number cannot exceed 30 characters")
        String phoneNumber,

        @Size(max = 50, message = "Index number cannot exceed 50 characters")
        String indexNumber) {}
