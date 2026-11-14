package com.campusfind.features.office;

import com.campusfind.features.office.dto.CreateOfficerRequest;
import com.campusfind.features.office.dto.OfficerProfileResponse;
import com.campusfind.features.office.dto.SecurityOfficeResponse;
import com.campusfind.features.office.dto.UpdateSecurityOfficeRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Security Office & Officers", description = "Endpoints for central security office information and administrative officer provisioning")
@SecurityRequirement(name = "bearerAuth")
public class SecurityOfficeController {

    private final SecurityOfficeService officeService;

    public SecurityOfficeController(SecurityOfficeService officeService) {
        this.officeService = officeService;
    }

    @GetMapping("/security-office")
    @Operation(summary = "Get Central Security Office details", description = "Retrieves active Central Security Office public contacts, location, and operating hours.")
    public ResponseEntity<SecurityOfficeResponse> getCentralOffice() {
        return ResponseEntity.ok(officeService.getCentralOffice());
    }

    @PutMapping("/admin/security-office")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update Central Security Office details", description = "Administrative management of Central Security Office info.")
    public ResponseEntity<SecurityOfficeResponse> updateCentralOffice(@Valid @RequestBody UpdateSecurityOfficeRequest request) {
        return ResponseEntity.ok(officeService.updateCentralOffice(request));
    }

    @GetMapping("/admin/officers")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "List Security Officers", description = "Administrative retrieval of all provisioned Security Officer accounts.")
    public ResponseEntity<List<OfficerProfileResponse>> listOfficers() {
        return ResponseEntity.ok(officeService.listOfficers());
    }

    @PostMapping("/admin/officers")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Provision Security Officer account", description = "Super Admin path to safely provision verified Security Officer accounts.")
    public ResponseEntity<OfficerProfileResponse> provisionOfficer(@Valid @RequestBody CreateOfficerRequest request) {
        OfficerProfileResponse response = officeService.provisionOfficer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
