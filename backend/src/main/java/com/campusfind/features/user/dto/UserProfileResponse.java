package com.campusfind.features.user.dto;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String fullName,
        UserRole role,
        UserStatus status,
        boolean emailVerified,
        String indexNumber,
        String phoneNumber,
        boolean indexNumberVerified,
        Instant createdAt) {

    public static UserProfileResponse fromEntity(UserEntity user) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                user.isEmailVerified(),
                user.getIndexNumber(),
                user.getPhoneNumber(),
                user.isIndexNumberVerified(),
                user.getCreatedAt());
    }
}
