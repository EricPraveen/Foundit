package com.campusfind.features.admin.dto;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Detailed user representation for administrative inspection and role/status governance")
public record AdminUserResponse(
        @Schema(description = "Unique user ID")
        UUID id,

        @Schema(description = "User university email (@uom.lk)")
        String email,

        @Schema(description = "User full name")
        String fullName,

        @Schema(description = "Assigned user role")
        UserRole role,

        @Schema(description = "Current account status")
        UserStatus status,

        @Schema(description = "Whether the user's email address has been verified")
        boolean emailVerified,

        @Schema(description = "Student Index Number (if configured)")
        String indexNumber,

        @Schema(description = "Contact phone number (if configured)")
        String phoneNumber,

        @Schema(description = "Whether student Index Number has been verified")
        boolean indexNumberVerified,

        @Schema(description = "Officer badge number (if user is a security officer)")
        String badgeNumber,

        @Schema(description = "Assigned security office ID (if officer)")
        UUID securityOfficeId,

        @Schema(description = "Assigned security office name (if officer)")
        String securityOfficeName,

        @Schema(description = "Account registration timestamp")
        Instant createdAt,

        @Schema(description = "Last account update timestamp")
        Instant updatedAt
) {}
