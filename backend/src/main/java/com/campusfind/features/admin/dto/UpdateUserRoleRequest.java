package com.campusfind.features.admin.dto;

import com.campusfind.domain.auth.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to update user role")
public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        @Schema(description = "Target user role (STUDENT, SECURITY_OFFICER, SUPER_ADMIN)")
        UserRole role,

        @Schema(description = "Optional badge number if transitioning to SECURITY_OFFICER")
        String badgeNumber,

        @Schema(description = "Optional administrative reason for role change")
        String reason
) {}
