package com.campusfind.features.claim;

import com.campusfind.features.claim.dto.ClaimResponse;
import com.campusfind.features.claim.dto.ClaimSummaryResponse;
import com.campusfind.features.claim.dto.DownloadedEvidence;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Item Claims", description = "Endpoints for students to claim found items, provide private ownership evidence, and track claim lifecycle")
@SecurityRequirement(name = "bearerAuth")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping(value = "/found-items/{itemId}/claims", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit an ownership claim for a found item", description = "Student submits a claim with index number, ownership description, Student ID card image, and proof of ownership.")
    public ResponseEntity<ClaimResponse> submitClaim(
            @PathVariable UUID itemId,
            Principal principal,
            @RequestParam("indexNumber") String indexNumber,
            @RequestParam("ownershipDescription") String ownershipDescription,
            @Parameter(description = "University Student ID Card image (JPEG, PNG, WebP, PDF up to 5MB)")
            @RequestPart("studentIdCard") MultipartFile studentIdCard,
            @Parameter(description = "Proof of ownership document or photo (JPEG, PNG, WebP, PDF up to 5MB)")
            @RequestPart("ownershipProof") MultipartFile ownershipProof,
            @Parameter(description = "Optional additional supporting proof (JPEG, PNG, WebP, PDF up to 5MB)")
            @RequestPart(value = "additionalProof", required = false) MultipartFile additionalProof) {

        ClaimResponse response = claimService.submitClaim(
                itemId,
                principal.getName(),
                indexNumber,
                ownershipDescription,
                studentIdCard,
                ownershipProof,
                additionalProof
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/claims/me")
    @Operation(summary = "Get my submitted claims", description = "Retrieves all claims submitted by the authenticated student.")
    public ResponseEntity<Page<ClaimSummaryResponse>> getMyClaims(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ClaimSummaryResponse> claims = claimService.getMyClaims(principal.getName(), pageable);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/claims/{claimId}")
    @Operation(summary = "Get specific claim details", description = "Retrieves claim details if owned by the authenticated student. Unauthorized requests return 404.")
    public ResponseEntity<ClaimResponse> getClaimById(
            @PathVariable UUID claimId,
            Principal principal) {
        ClaimResponse claim = claimService.getClaimById(claimId, principal.getName());
        return ResponseEntity.ok(claim);
    }

    @PostMapping("/claims/{claimId}/cancel")
    @Operation(summary = "Cancel a pending claim", description = "Allows claimant to cancel their claim while in PENDING status.")
    public ResponseEntity<ClaimResponse> cancelClaim(
            @PathVariable UUID claimId,
            Principal principal) {
        ClaimResponse response = claimService.cancelClaim(claimId, principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/claims/{claimId}/evidence/{evidenceId}")
    @Operation(summary = "Download private claim evidence file", description = "Streams raw evidence file. Accessible only to the claim owner, authorized officers, or super admin.")
    public ResponseEntity<byte[]> getEvidenceFile(
            @PathVariable UUID claimId,
            @PathVariable UUID evidenceId,
            Principal principal) {
        DownloadedEvidence file = claimService.getEvidenceFile(claimId, evidenceId, principal.getName());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.filename() + "\"")
                .body(file.data());
    }
}
