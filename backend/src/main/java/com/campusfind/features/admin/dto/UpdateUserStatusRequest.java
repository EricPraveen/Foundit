package com.campusfind.features.admin.dto;

import com.campusfind.domain.auth.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to update user account status")
public record UpdateUserStatusRequest(
        @NotNull(message = "Status is required")
        @Schema(description = "Target account status (ACTIVE, INACTIVE, SUSPENDED)")
        UserStatus status,

        @Schema(description = "Optional administrative reason for status change")
        String reason
) {}
