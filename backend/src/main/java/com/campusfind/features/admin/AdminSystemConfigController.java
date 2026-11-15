package com.campusfind.features.admin;

import com.campusfind.features.admin.dto.SystemConfigResponse;
import com.campusfind.features.notification.NotificationProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/system-config")
@Tag(name = "Administrative System Configuration", description = "Inspect system-level operational thresholds, notification parameters, and storage policies")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminSystemConfigController {

    private final NotificationProperties notificationProperties;

    @Value("${app.storage.provider:local}")
    private String storageProvider;

    @Value("${app.reputation.default-handover-points:10}")
    private int defaultHandoverPoints;

    @Value("${app.reputation.default-collection-points:0}")
    private int defaultCollectionPoints;

    public AdminSystemConfigController(NotificationProperties notificationProperties) {
        this.notificationProperties = notificationProperties;
    }

    @GetMapping
    @Operation(summary = "Get system operational configuration and policies", description = "Super Admin endpoint to inspect active policy parameters, thresholds, and infrastructure settings.")
    public ResponseEntity<SystemConfigResponse> getSystemConfig() {
        SystemConfigResponse response = new SystemConfigResponse(
                notificationProperties.isUnclaimedEnabled(),
                notificationProperties.getUnclaimedThresholdDays(),
                24,
                notificationProperties.isEmailEnabled(),
                notificationProperties.getMaxEmailRetries(),
                notificationProperties.getEmailRetryDelaySeconds(),
                defaultHandoverPoints,
                defaultCollectionPoints,
                storageProvider,
                notificationProperties.getBaseUrl(),
                "Operational policies are managed via environment variables and application profiles. Category-based reputation rules can be calibrated dynamically under /api/v1/admin/reputation-rules."
        );
        return ResponseEntity.ok(response);
    }
}
