package com.campusfind.features.admin;

import com.campusfind.features.admin.dto.ReputationRuleResponse;
import com.campusfind.features.admin.dto.UpdateReputationRuleRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reputation-rules")
@Tag(name = "Administrative Reputation Rules", description = "Endpoints for Super Admins to inspect and calibrate category-based reputation points")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminReputationRuleController {

    private final AdminReputationRuleService ruleService;

    public AdminReputationRuleController(AdminReputationRuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    @Operation(summary = "List all category reputation rules", description = "Super Admin endpoint to inspect points assigned for found item handover and collection per category.")
    public ResponseEntity<List<ReputationRuleResponse>> getAllRules() {
        return ResponseEntity.ok(ruleService.getAllRules());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update reputation rule points or active status", description = "Super Admin endpoint to calibrate points or activate/deactivate a reputation rule.")
    public ResponseEntity<ReputationRuleResponse> updateRule(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReputationRuleRequest request,
            Principal principal) {
        ReputationRuleResponse response = ruleService.updateRule(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }
}
