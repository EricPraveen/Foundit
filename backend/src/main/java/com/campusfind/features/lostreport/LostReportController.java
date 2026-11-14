package com.campusfind.features.lostreport;

import com.campusfind.features.lostreport.dto.CancelLostReportRequest;
import com.campusfind.features.lostreport.dto.CreateLostReportRequest;
import com.campusfind.features.lostreport.dto.LostReportImageResponse;
import com.campusfind.features.lostreport.dto.LostReportResponse;
import com.campusfind.features.lostreport.dto.ResolveLostReportRequest;
import com.campusfind.features.lostreport.dto.UpdateLostReportRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/lost-reports")
@Tag(name = "Lost Reports", description = "Private lost report lifecycle and student ownership management APIs")
@SecurityRequirement(name = "bearerAuth")
public class LostReportController {

    private final LostReportService lostReportService;

    public LostReportController(LostReportService lostReportService) {
        this.lostReportService = lostReportService;
    }

    @PostMapping
    @Operation(summary = "Submit a Lost Item Report", description = "Student submits a private lost item report. Report defaults to ACTIVE status.")
    public ResponseEntity<LostReportResponse> createLostReport(
            Principal principal,
            @Valid @RequestBody CreateLostReportRequest request) {
        LostReportResponse response = lostReportService.createLostReport(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Get my lost reports", description = "Retrieves all private lost reports submitted by the authenticated student.")
    public ResponseEntity<Page<LostReportResponse>> getMyLostReports(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<LostReportResponse> reports = lostReportService.getMyLostReports(principal.getName(), pageable);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get my specific lost report", description = "Retrieves specific lost report owned by the authenticated student. Unauthorized requests return 404.")
    public ResponseEntity<LostReportResponse> getMyLostReportById(
            @PathVariable UUID id,
            Principal principal) {
        LostReportResponse response = lostReportService.getMyLostReportById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an active lost report", description = "Allows the report owner to update details while in ACTIVE status.")
    public ResponseEntity<LostReportResponse> updateLostReport(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody UpdateLostReportRequest request) {
        LostReportResponse response = lostReportService.updateLostReport(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a lost report", description = "Allows the report owner to withdraw/cancel their report while in ACTIVE status.")
    public ResponseEntity<LostReportResponse> cancelLostReport(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody(required = false) CancelLostReportRequest request) {
        LostReportResponse response = lostReportService.cancelLostReport(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Resolve a lost report", description = "Allows the report owner to mark their report as resolved (e.g. item recovered) while in ACTIVE status.")
    public ResponseEntity<LostReportResponse> resolveLostReport(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody(required = false) ResolveLostReportRequest request) {
        LostReportResponse response = lostReportService.resolveLostReport(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image for lost report", description = "Uploads JPEG, PNG, or WebP image (max 5 MB). Accessible by report owner.")
    public ResponseEntity<LostReportImageResponse> uploadImage(
            @PathVariable UUID id,
            Principal principal,
            @Parameter(description = "Image file (JPEG, PNG, WebP up to 5MB)")
            @RequestPart("file") MultipartFile file) {
        LostReportImageResponse response = lostReportService.uploadImage(id, principal.getName(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @Operation(summary = "Delete image from lost report", description = "Deletes an image from the report and storage.")
    public ResponseEntity<Void> deleteImage(
            @PathVariable UUID id,
            @PathVariable UUID imageId,
            Principal principal) {
        lostReportService.deleteImage(id, imageId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
