package com.campusfind.features.claim;

import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.features.claim.dto.ApproveClaimRequest;
import com.campusfind.features.claim.dto.ClaimResponse;
import com.campusfind.features.claim.dto.DownloadedEvidence;
import com.campusfind.features.claim.dto.RejectClaimRequest;
import com.campusfind.features.collection.CollectionService;
import com.campusfind.features.collection.dto.CollectionConfirmationResponse;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
@RequestMapping("/api/v1/officer/claims")
@Tag(name = "Security Officer Claims", description = "Endpoints for Security Officers to review ownership evidence, approve legitimate claims, and reject invalid claims")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")
public class OfficerClaimController {

    private final ClaimService claimService;
    private final CollectionService collectionService;

    public OfficerClaimController(ClaimService claimService, CollectionService collectionService) {
        this.claimService = claimService;
        this.collectionService = collectionService;
    }

    @GetMapping
    @Operation(summary = "List claims within officer office scope", description = "Retrieves submitted claims for found items assigned to the officer's security office.")
    public ResponseEntity<Page<ClaimResponse>> listClaims(
            Principal principal,
            @RequestParam(required = false) ClaimStatus status,
            @RequestParam(required = false) UUID itemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "submittedAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String property = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<ClaimResponse> claims = claimService.officerListClaims(principal.getName(), status, itemId, pageable);
        return ResponseEntity.ok(claims);
    }

    @GetMapping("/{claimId}")
    @Operation(summary = "Get claim details for officer review", description = "Retrieves claim and claimant information. Restricted to the assigned security office scope.")
    public ResponseEntity<ClaimResponse> getClaimById(
            @PathVariable UUID claimId,
            Principal principal) {
        ClaimResponse claim = claimService.officerGetClaimById(claimId, principal.getName());
        return ResponseEntity.ok(claim);
    }

    @PostMapping("/{claimId}/approve")
    @Operation(summary = "Approve an ownership claim", description = "Officer verifies evidence and approves the claim. Item is marked CLAIM_PENDING. Concurrency-safe.")
    public ResponseEntity<ClaimResponse> approveClaim(
            @PathVariable UUID claimId,
            Principal principal,
            @Valid @RequestBody(required = false) ApproveClaimRequest request) {
        ClaimResponse response = claimService.officerApproveClaim(claimId, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{claimId}/reject")
    @Operation(summary = "Reject an ownership claim", description = "Officer rejects an unsubstantiated claim with mandatory reason. Item remains AVAILABLE.")
    public ResponseEntity<ClaimResponse> rejectClaim(
            @PathVariable UUID claimId,
            Principal principal,
            @Valid @RequestBody RejectClaimRequest request) {
        ClaimResponse response = claimService.officerRejectClaim(claimId, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{claimId}/evidence/{evidenceId}")
    @Operation(summary = "Download private claim evidence for officer review", description = "Streams raw evidence file. Restricted to the item's security office scope.")
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

    @PostMapping("/{claimId}/confirm-collection")
    @Operation(summary = "Confirm physical collection of claimed item", description = "Officer verifies physical student identity and confirms collection, atomically completing the claim, marking item RETURNED, updating linked lost report to RECOVERED if present, and awarding reputation points.")
    public ResponseEntity<CollectionConfirmationResponse> confirmCollection(
            @PathVariable UUID claimId,
            Principal principal,
            @Valid @RequestBody(required = false) ConfirmCollectionRequest request) {
        CollectionConfirmationResponse response = collectionService.confirmCollection(claimId, principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}
