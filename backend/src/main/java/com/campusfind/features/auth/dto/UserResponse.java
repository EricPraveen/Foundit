package com.campusfind.features.auth.dto;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import java.util.UUID;

public record UserResponse(UUID id, String email, String fullName, UserRole role) {

    public static UserResponse fromEntity(UserEntity user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
