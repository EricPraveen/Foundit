package com.campusfind.features.user;

import com.campusfind.features.auth.AuthService;
import com.campusfind.features.user.dto.UpdateProfileRequest;
import com.campusfind.features.user.dto.UserProfileResponse;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserProfileService {

    private final UserRepository userRepository;

    public UserProfileService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(String email) {
        UserEntity user = userRepository.findByEmail(AuthService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found."));
        return UserProfileResponse.fromEntity(user);
    }

    @Transactional
    public UserProfileResponse updateMyProfile(String email, UpdateProfileRequest request) {
        UserEntity user = userRepository.findByEmail(AuthService.normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found."));

        // Only permitted profile fields are updated.
        // Role, status, email, and emailVerified are strictly protected and immutable from this endpoint.
        user.setFullName(request.fullName().trim());

        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber().trim());
        }

        if (request.indexNumber() != null) {
            String newIndex = request.indexNumber().trim();
            if (!newIndex.equalsIgnoreCase(user.getIndexNumber())) {
                user.setIndexNumber(newIndex);
                // Policy: index number validation is unverified until officer-checked; reset verification if changed
                user.setIndexNumberVerified(false);
            }
        }

        userRepository.save(user);
        return UserProfileResponse.fromEntity(user);
    }
}
