package com.campusfind.features.admin.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "System operational policies and infrastructure configuration values")
public record SystemConfigResponse(
        @Schema(description = "Whether automated unclaimed item escalation is enabled")
        boolean unclaimedEscalationEnabled,

        @Schema(description = "Threshold in days before an unclaimed item triggers escalation")
        int unclaimedThresholdDays,

        @Schema(description = "Interval in hours between pending handover reminders")
        int handoverReminderIntervalHours,

        @Schema(description = "Whether email notifications are dispatched")
        boolean emailNotificationsEnabled,

        @Schema(description = "Maximum delivery retry attempts for transient email failures")
        int maxEmailRetries,

        @Schema(description = "Delay in seconds between email retry attempts")
        int emailRetryDelaySeconds,

        @Schema(description = "Default reputation points awarded for physical handover")
        int defaultHandoverPoints,

        @Schema(description = "Default reputation points awarded for confirmed collection")
        int defaultCollectionPoints,

        @Schema(description = "Configured file storage provider (e.g., local, supabase)")
        String storageProvider,

        @Schema(description = "Configured frontend application base URL")
        String appBaseUrl,

        @Schema(description = "Operational governance guidance")
        String notice
) {}
