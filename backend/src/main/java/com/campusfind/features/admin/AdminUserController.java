package com.campusfind.features.admin;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.admin.dto.AdminUserResponse;
import com.campusfind.features.admin.dto.UpdateUserRoleRequest;
import com.campusfind.features.admin.dto.UpdateUserStatusRequest;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "Administrative User Management", description = "Endpoints for Super Admins to inspect accounts, govern roles, and manage activation/deactivation")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    @Operation(summary = "Search and list users", description = "Super Admin endpoint to list all platform users with role/status filters, keyword search, and pagination.")
    public ResponseEntity<Page<AdminUserResponse>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        String[] sortParts = sort.split(",");
        String property = sortParts[0];
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, property));
        Page<AdminUserResponse> users = adminUserService.getUsers(query, role, status, pageable);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get user account details", description = "Super Admin endpoint to inspect full account details for a specific user.")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminUserService.getUserById(userId));
    }

    @PatchMapping("/{userId}/status")
    @Operation(summary = "Update user account status", description = "Super Admin endpoint to activate, deactivate, or suspend a user account. Cannot deactivate last Super Admin or activate unverified accounts.")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Principal principal) {
        AdminUserResponse response = adminUserService.updateUserStatus(userId, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{userId}/role")
    @Operation(summary = "Update user role", description = "Super Admin endpoint to promote or demote user roles. Cannot demote last active Super Admin. Creates officer profile if assigned to SECURITY_OFFICER.")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserRoleRequest request,
            Principal principal) {
        AdminUserResponse response = adminUserService.updateUserRole(userId, request, principal.getName());
        return ResponseEntity.ok(response);
    }
}
