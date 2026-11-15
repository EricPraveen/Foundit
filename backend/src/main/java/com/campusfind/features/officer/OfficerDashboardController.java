package com.campusfind.features.officer;

import com.campusfind.features.officer.dto.OfficerDashboardResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/officer/dashboard")
@Tag(name = "Security Officer Dashboard", description = "Operational statistics, counts, and triage metrics for the Central Security Office")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")
public class OfficerDashboardController {

    private final OfficerDashboardService dashboardService;

    public OfficerDashboardController(OfficerDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(summary = "Get Central Security Office operational dashboard", description = "Returns persisted aggregate counts for available items, pending handovers, pending claims, pending collections, returned items, and unclaimed items within office scope.")
    public ResponseEntity<OfficerDashboardResponse> getDashboard(Principal principal) {
        OfficerDashboardResponse dashboard = dashboardService.getDashboard(principal.getName());
        return ResponseEntity.ok(dashboard);
    }
}
