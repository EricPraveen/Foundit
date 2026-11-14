package com.campusfind.features.office.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateOfficerRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        String email,

        @NotBlank(message = "Full name is required")
        @Size(max = 150, message = "Full name cannot exceed 150 characters")
        String fullName,

        @NotBlank(message = "Temporary password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        String password,

        @Size(max = 100, message = "Badge number cannot exceed 100 characters")
        String badgeNumber) {}
