package com.campusfind.features.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request to update points or active status of a reputation rule")
public record UpdateReputationRuleRequest(
        @NotNull(message = "Points is required")
        @Min(value = 0, message = "Points must be non-negative")
        @Schema(description = "Reputation points awarded", example = "15")
        Integer points,

        @Schema(description = "Whether this rule should be active")
        Boolean active
) {}
