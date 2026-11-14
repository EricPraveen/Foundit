package com.campusfind.features.location;

import com.campusfind.features.location.dto.CreateLocationRequest;
import com.campusfind.features.location.dto.LocationResponse;
import com.campusfind.features.location.dto.UpdateLocationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Campus Locations", description = "University campus location reference data for reporting and custody")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/locations")
    @Operation(summary = "List active campus locations", description = "Retrieves active campus locations in alphabetical order for lost and found reports.")
    public ResponseEntity<List<LocationResponse>> getActiveLocations() {
        return ResponseEntity.ok(locationService.getActiveLocations());
    }

    @GetMapping("/admin/locations")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all campus locations", description = "Super Admin endpoint to inspect all locations including inactive ones.")
    public ResponseEntity<List<LocationResponse>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @PostMapping("/admin/locations")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create campus location", description = "Super Admin endpoint to define a new unique campus location.")
    public ResponseEntity<LocationResponse> createLocation(@Valid @RequestBody CreateLocationRequest request) {
        LocationResponse response = locationService.createLocation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/admin/locations/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update campus location", description = "Super Admin endpoint to update location details.")
    public ResponseEntity<LocationResponse> updateLocation(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(locationService.updateLocation(id, request));
    }

    @PatchMapping("/admin/locations/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change location active status", description = "Super Admin endpoint to activate or deactivate a location safely without hard deletion.")
    public ResponseEntity<LocationResponse> setLocationStatus(
            @PathVariable("id") UUID id,
            @RequestParam("active") boolean active) {
        return ResponseEntity.ok(locationService.setLocationStatus(id, active));
    }
}
