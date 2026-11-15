package com.campusfind.features.item;

import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.features.collection.CollectionService;
import com.campusfind.features.collection.dto.CollectionConfirmationResponse;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.features.item.dto.FoundItemResponse;
import com.campusfind.features.item.dto.HandoverLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.time.Duration;
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
@RequestMapping("/api/v1/officer/found-items")
@Tag(name = "Security Officer Handover & Inventory", description = "Endpoints for Security Officers to review pending handovers, confirm physical custody, inspect inventory, and view collection history")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('SECURITY_OFFICER', 'SUPER_ADMIN')")
public class OfficerFoundItemController {

    private final FoundItemService foundItemService;
    private final CollectionService collectionService;

    public OfficerFoundItemController(FoundItemService foundItemService, CollectionService collectionService) {
        this.foundItemService = foundItemService;
        this.collectionService = collectionService;
    }

    @GetMapping
    @Operation(summary = "List and filter found items within officer office scope", description = "Retrieves found items assigned to the officer's security office with status, category, location, and search filters.")
    public ResponseEntity<Page<FoundItemResponse>> listFoundItems(
            Principal principal,
            @RequestParam(required = false) ItemAvailabilityStatus availabilityStatus,
            @RequestParam(required = false) HandoverStatus handoverStatus,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String property = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<FoundItemResponse> items = foundItemService.officerListFoundItems(
                principal.getName(), availabilityStatus, handoverStatus, categoryId, locationId, query, pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/pending-handover")
    @Operation(summary = "Get pending handover items", description = "Retrieves all items awaiting physical handover at the officer's assigned Security Office.")
    public ResponseEntity<Page<FoundItemResponse>> getPendingHandovers(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FoundItemResponse> items = foundItemService.getPendingHandoverItems(principal.getName(), pageable);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/overdue-handover")
    @Operation(summary = "Get overdue pending handovers", description = "Retrieves pending handovers created more than 24 hours ago without physical custody.")
    public ResponseEntity<List<FoundItemResponse>> getOverdueHandovers(
            @RequestParam(defaultValue = "24") int hours) {
        List<FoundItemResponse> overdueItems = foundItemService.getOverduePendingHandovers(Duration.ofHours(hours));
        return ResponseEntity.ok(overdueItems);
    }

    @PostMapping("/{id}/confirm-handover")
    @Operation(summary = "Confirm physical handover of found item", description = "Officer verifies physical receipt, records custody, and transitions item to AVAILABLE.")
    public ResponseEntity<FoundItemResponse> confirmHandover(
            @PathVariable UUID id,
            Principal principal,
            @Valid @RequestBody(required = false) ConfirmHandoverRequest request) {
        FoundItemResponse response = foundItemService.confirmHandover(id, principal.getName(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/handover-history")
    @Operation(summary = "Get handover audit history", description = "Returns immutable handover audit log for a found item.")
    public ResponseEntity<List<HandoverLogResponse>> getHandoverHistory(@PathVariable UUID id) {
        List<HandoverLogResponse> history = foundItemService.getHandoverHistory(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/{id}/collection")
    @Operation(summary = "Get collection confirmation details for a found item", description = "Returns physical collection log and metadata for a returned found item.")
    public ResponseEntity<CollectionConfirmationResponse> getCollectionByFoundItemId(
            @PathVariable UUID id,
            Principal principal) {
        CollectionConfirmationResponse response = collectionService.getCollectionByFoundItemId(id, principal.getName());
        return ResponseEntity.ok(response);
    }
}
