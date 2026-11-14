package com.campusfind.features.item;

import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.features.item.dto.FoundItemImageResponse;
import com.campusfind.features.item.dto.FoundItemResponse;
import com.campusfind.features.item.dto.FoundItemSummaryResponse;
import com.campusfind.features.item.dto.UpdateFoundItemRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/v1/found-items")
@Tag(name = "Found Items", description = "Found item reporting, public discovery, and finder management APIs")
public class FoundItemController {

    private final FoundItemService foundItemService;

    public FoundItemController(FoundItemService foundItemService) {
        this.foundItemService = foundItemService;
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Submit a Found Item Report", description = "Students submit a found item report. The item is placed in PENDING_HANDOVER status until physical handover.")
    public ResponseEntity<FoundItemResponse> reportFoundItem(
            Principal principal,
            @Valid @RequestBody CreateFoundItemRequest request) {
        FoundItemResponse response = foundItemService.reportFoundItem(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Browse available found items", description = "Public student browse endpoint. Only returns items that have been physically verified and confirmed by officers (AVAILABLE).")
    public ResponseEntity<Page<FoundItemSummaryResponse>> getAvailableFoundItems(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) Instant fromDate,
            @RequestParam(required = false) Instant toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "foundAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String property = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc") 
                ? Sort.Direction.ASC 
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<FoundItemSummaryResponse> results = foundItemService.getAvailableFoundItems(
                query, categoryId, locationId, fromDate, toDate, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get my submitted found reports", description = "Retrieves all found reports submitted by the authenticated student (including pending handovers).")
    public ResponseEntity<Page<FoundItemResponse>> getMyFoundReports(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FoundItemResponse> reports = foundItemService.getMyFoundReports(principal.getName(), pageable);
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get found item details", description = "Retrieves specific found item details. Public users only view AVAILABLE items with masked finder info.")
    public ResponseEntity<FoundItemResponse> getFoundItemById(
            @PathVariable UUID id,
            Principal principal) {
        String email = principal != null ? principal.getName() : null;
        FoundItemResponse response = foundItemService.getFoundItemById(id, email);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a pending found item report", description = "Allows the finder to update details before the physical handover occurs.")
    public ResponseEntity<FoundItemResponse> updateFoundItem(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody UpdateFoundItemRequest request) {
        FoundItemResponse response = foundItemService.updateFoundItem(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/cancel")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Cancel a pending found item report", description = "Allows the finder to cancel a report before physical handover.")
    public ResponseEntity<FoundItemResponse> cancelFoundReport(
            @PathVariable UUID id,
            Principal principal) {
        FoundItemResponse response = foundItemService.cancelFoundReport(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Upload image for found item report", description = "Uploads JPEG, PNG, or WebP image (max 5 MB). Accessible by finder or officer.")
    public ResponseEntity<FoundItemImageResponse> uploadImage(
            @PathVariable UUID id,
            Principal principal,
            @Parameter(description = "Image file (JPEG, PNG, WebP up to 5MB)")
            @RequestPart("file") MultipartFile file) {
        FoundItemImageResponse response = foundItemService.uploadImage(id, principal.getName(), file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete image from found item report", description = "Deletes an image from the report and storage.")
    public ResponseEntity<Void> deleteImage(
            @PathVariable UUID id,
            @PathVariable UUID imageId,
            Principal principal) {
        foundItemService.deleteImage(id, imageId, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
