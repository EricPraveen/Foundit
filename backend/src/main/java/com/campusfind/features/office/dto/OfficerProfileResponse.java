package com.campusfind.features.office.dto;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import java.util.UUID;

public record OfficerProfileResponse(
        UUID userId,
        String email,
        String fullName,
        UserRole role,
        UserStatus status,
        String badgeNumber,
        String officeName) {}
