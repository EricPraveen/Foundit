package com.campusfind.features.admin.dto;

import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "Category-based reputation rule defining points awarded for specific lifecycle transactions")
public record ReputationRuleResponse(
        @Schema(description = "Rule identifier")
        UUID id,

        @Schema(description = "Associated category ID")
        UUID categoryId,

        @Schema(description = "Associated category name")
        String categoryName,

        @Schema(description = "Lifecycle transaction type")
        ReputationTransactionType transactionType,

        @Schema(description = "Reputation points awarded")
        int points,

        @Schema(description = "Whether this rule is active")
        boolean active,

        @Schema(description = "Creation timestamp")
        Instant createdAt,

        @Schema(description = "Last update timestamp")
        Instant updatedAt
) {
    public static ReputationRuleResponse fromEntity(CategoryReputationRuleEntity entity) {
        return new ReputationRuleResponse(
                entity.getId(),
                entity.getCategory() != null ? entity.getCategory().getId() : null,
                entity.getCategory() != null ? entity.getCategory().getName() : null,
                entity.getTransactionType(),
                entity.getPoints(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
