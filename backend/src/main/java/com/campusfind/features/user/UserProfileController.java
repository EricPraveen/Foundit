package com.campusfind.features.user;

import com.campusfind.features.user.dto.UpdateProfileRequest;
import com.campusfind.features.user.dto.UserProfileResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "User Profiles", description = "Endpoints for retrieving and managing the authenticated user's profile")
@SecurityRequirement(name = "bearerAuth")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get authenticated user profile", description = "Retrieves the safe personal profile derived from the authenticated principal.")
    public ResponseEntity<UserProfileResponse> getMyProfile(Principal principal) {
        UserProfileResponse response = userProfileService.getMyProfile(principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Operation(summary = "Update authenticated user profile", description = "Updates permitted fields (full name, phone number, index number). Security roles and account status cannot be altered.")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserProfileResponse response = userProfileService.updateMyProfile(principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}
