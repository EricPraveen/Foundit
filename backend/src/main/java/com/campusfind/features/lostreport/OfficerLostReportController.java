package com.campusfind.features.lostreport;

import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.lostreport.dto.CancelLostReportRequest;
import com.campusfind.features.lostreport.dto.LostReportAuditLogResponse;
import com.campusfind.features.lostreport.dto.LostReportResponse;
import com.campusfind.features.lostreport.dto.ResolveLostReportRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/officer/lost-reports")
@Tag(name = "Security Officer Lost Reports", description = "Endpoints for Security Officers to review, search, and manage private Lost Reports within their office scope")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")
public class OfficerLostReportController {

    private final LostReportService lostReportService;

    public OfficerLostReportController(LostReportService lostReportService) {
        this.lostReportService = lostReportService;
    }

    @GetMapping
    @Operation(summary = "Search and list lost reports within office scope", description = "Retrieves lost reports assigned to the officer's security office with optional filtering.")
    public ResponseEntity<Page<LostReportResponse>> searchLostReports(
            Principal principal,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) LostReportStatus status,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) Instant fromDate,
            @RequestParam(required = false) Instant toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String property = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<LostReportResponse> reports = lostReportService.officerSearchLostReports(
                principal.getName(), query, status, categoryId, locationId, fromDate, toDate, pageable);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get lost report details within office scope", description = "Retrieves specific lost report and reporting student contact info. Access restricted to officer's office scope.")
    public ResponseEntity<LostReportResponse> getLostReportById(
            @PathVariable UUID id,
            Principal principal) {
        LostReportResponse report = lostReportService.officerGetLostReportById(id, principal.getName());
        return ResponseEntity.ok(report);
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Officer resolves a lost report", description = "Marks a lost report as resolved after operational assistance. Restricted to officer's office scope.")
    public ResponseEntity<LostReportResponse> resolveLostReport(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody(required = false) ResolveLostReportRequest request) {
        LostReportResponse response = lostReportService.officerResolveLostReport(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Officer cancels a lost report", description = "Cancels an invalid or withdrawn lost report. Restricted to officer's office scope.")
    public ResponseEntity<LostReportResponse> cancelLostReport(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody(required = false) CancelLostReportRequest request) {
        LostReportResponse response = lostReportService.officerCancelLostReport(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/audit-history")
    @Operation(summary = "Get lost report lifecycle audit history", description = "Returns immutable lifecycle audit logs for a lost report. Restricted to officer's office scope.")
    public ResponseEntity<List<LostReportAuditLogResponse>> getAuditHistory(
            @PathVariable UUID id,
            Principal principal) {
        List<LostReportAuditLogResponse> history = lostReportService.getAuditHistory(id, principal.getName());
        return ResponseEntity.ok(history);
    }
}
