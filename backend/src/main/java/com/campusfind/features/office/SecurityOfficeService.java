package com.campusfind.features.office;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.audit.AuditService;
import com.campusfind.features.auth.AuthService;
import com.campusfind.features.office.dto.CreateOfficerRequest;
import com.campusfind.features.office.dto.OfficerProfileResponse;
import com.campusfind.features.office.dto.SecurityOfficeResponse;
import com.campusfind.features.office.dto.UpdateSecurityOfficeRequest;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SecurityOfficeService {

    private final SecurityOfficeRepository officeRepository;
    private final SecurityOfficerProfileRepository officerProfileRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public SecurityOfficeService(
            SecurityOfficeRepository officeRepository,
            SecurityOfficerProfileRepository officerProfileRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService) {
        this.officeRepository = officeRepository;
        this.officerProfileRepository = officerProfileRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public SecurityOfficeResponse getCentralOffice() {
        SecurityOfficeEntity office = officeRepository.findFirstByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Central Security Office information is unavailable."));
        return SecurityOfficeResponse.fromEntity(office);
    }

    @Transactional
    public SecurityOfficeResponse updateCentralOffice(UpdateSecurityOfficeRequest request) {
        SecurityOfficeEntity office = officeRepository.findFirstByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Central Security Office information is unavailable."));

        office.setName(request.name().trim());
        office.setCampusLocation(request.campusLocation().trim());
        if (request.contactEmail() != null) office.setContactEmail(request.contactEmail().trim());
        if (request.contactPhone() != null) office.setContactPhone(request.contactPhone().trim());
        if (request.operatingHours() != null) office.setOperatingHours(request.operatingHours().trim());

        officeRepository.save(office);

        auditService.recordSuccess(
                null,
                null,
                "SUPER_ADMIN",
                "OFFICE_UPDATED",
                "SECURITY_OFFICE",
                office.getId().toString(),
                "Central Security Office information updated: " + office.getName());

        return SecurityOfficeResponse.fromEntity(office);
    }

    @Transactional(readOnly = true)
    public List<OfficerProfileResponse> listOfficers() {
        SecurityOfficeEntity office = officeRepository.findFirstByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Central Security Office not configured."));

        return officerProfileRepository.findAllBySecurityOfficeId(office.getId()).stream()
                .map(profile -> {
                    UserEntity user = profile.getUser();
                    return new OfficerProfileResponse(
                            profile.getUserId(),
                            user != null ? user.getEmail() : "",
                            user != null ? user.getFullName() : "",
                            user != null ? user.getRole() : UserRole.SECURITY_OFFICER,
                            user != null ? user.getStatus() : UserStatus.ACTIVE,
                            profile.getBadgeNumber(),
                            office.getName());
                })
                .toList();
    }

    @Transactional
    public OfficerProfileResponse provisionOfficer(CreateOfficerRequest request) {
        String normalizedEmail = AuthService.normalizeEmail(request.email());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user account with this email address already exists.");
        }

        SecurityOfficeEntity office = officeRepository.findFirstByActiveTrue()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Central Security Office is not configured."));

        // Privileged provisioning by Super Admin: create officer account directly with email verified
        UserEntity officerUser = new UserEntity(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                UserRole.SECURITY_OFFICER);
        officerUser.setEmailVerified(true);
        officerUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(officerUser);

        SecurityOfficerProfileEntity profile = new SecurityOfficerProfileEntity(
                officerUser.getId(),
                office,
                request.badgeNumber() != null ? request.badgeNumber().trim() : null);
        officerProfileRepository.save(profile);

        auditService.recordSuccess(
                null,
                null,
                "SUPER_ADMIN",
                "OFFICER_PROVISIONED",
                "USER",
                officerUser.getId().toString(),
                "Security Officer account provisioned: " + officerUser.getEmail());

        return new OfficerProfileResponse(
                officerUser.getId(),
                officerUser.getEmail(),
                officerUser.getFullName(),
                officerUser.getRole(),
                officerUser.getStatus(),
                profile.getBadgeNumber(),
                office.getName());
    }
}
