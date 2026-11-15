package com.campusfind.features.audit.dto;

import com.campusfind.infrastructure.persistence.entity.AuditLogEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Audit trail entry representing an auditable operational, business, or security event")
public record AuditLogResponse(
        @Schema(description = "Unique audit record identifier")
        UUID id,

        @Schema(description = "Actor user ID (null for system actions)")
        UUID actorUserId,

        @Schema(description = "Actor email address")
        String actorEmail,

        @Schema(description = "Actor role at time of action")
        String actorRole,

        @Schema(description = "Action name performed")
        String action,

        @Schema(description = "Target entity type")
        String entityType,

        @Schema(description = "Target entity ID")
        String entityId,

        @Schema(description = "Action outcome: SUCCESS or FAILURE")
        String outcome,

        @Schema(description = "Safe non-sensitive metadata")
        String metadata,

        @Schema(description = "Client IP address if available")
        String ipAddress,

        @Schema(description = "Timestamp when the event occurred")
        Instant createdAt
) {
    public static AuditLogResponse fromEntity(AuditLogEntity entity) {
        return new AuditLogResponse(
                entity.getId(),
                entity.getActorUserId(),
                entity.getActorEmail(),
                entity.getActorRole(),
                entity.getAction(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getOutcome(),
                entity.getMetadata(),
                entity.getIpAddress(),
                entity.getCreatedAt()
        );
    }
}
