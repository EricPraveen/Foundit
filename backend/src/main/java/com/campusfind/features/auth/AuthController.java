package com.campusfind.features.auth;

import com.campusfind.features.auth.dto.AuthResponse;
import com.campusfind.features.auth.dto.LoginRequest;
import com.campusfind.features.auth.dto.MessageResponse;
import com.campusfind.features.auth.dto.RegisterRequest;
import com.campusfind.features.auth.dto.ResendVerificationRequest;
import com.campusfind.features.auth.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication & Access", description = "Endpoints for student registration, email verification, login, and identity resolution")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register new student account", description = "Accepts official @uom.lk email only. Assigns STUDENT role and sends email verification token.")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        MessageResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify university email", description = "Validates the single-use expiring token and activates the student account.")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam("token") String token) {
        MessageResponse response = authService.verifyEmail(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification link", description = "Invalidates old tokens and sends a fresh verification token to unverified accounts.")
    public ResponseEntity<MessageResponse> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        MessageResponse response = authService.resendVerification(request.email());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Verifies credentials, checks email verification, and issues signed JWT access token.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated profile", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        UserResponse response = authService.getCurrentUser(principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/officer-only")
    @PreAuthorize("hasRole('SECURITY_OFFICER')")
    @Operation(summary = "Officer restricted check", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MessageResponse> officerRestricted() {
        return ResponseEntity.ok(new MessageResponse("Authorized for Security Officer"));
    }

    @GetMapping("/admin-only")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Super Admin restricted check", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MessageResponse> adminRestricted() {
        return ResponseEntity.ok(new MessageResponse("Authorized for Super Admin"));
    }
}
