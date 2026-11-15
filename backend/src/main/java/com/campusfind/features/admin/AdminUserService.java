package com.campusfind.features.admin;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.admin.dto.AdminUserResponse;
import com.campusfind.features.admin.dto.UpdateUserRoleRequest;
import com.campusfind.features.admin.dto.UpdateUserStatusRequest;
import com.campusfind.features.audit.AuditService;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final SecurityOfficerProfileRepository officerProfileRepository;
    private final SecurityOfficeRepository officeRepository;
    private final AuditService auditService;

    public AdminUserService(
            UserRepository userRepository,
            SecurityOfficerProfileRepository officerProfileRepository,
            SecurityOfficeRepository officeRepository,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.officerProfileRepository = officerProfileRepository;
        this.officeRepository = officeRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getUsers(
            String query,
            UserRole role,
            UserStatus status,
            Pageable pageable) {

        Specification<UserEntity> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (query != null && !query.isBlank()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("fullName")), searchPattern);
                Predicate indexMatch = cb.like(cb.lower(cb.coalesce(root.get("indexNumber"), "")), searchPattern);
                predicates.add(cb.or(emailMatch, nameMatch, indexMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return userRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(UUID userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));
        return mapToResponse(user);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(UUID userId, UpdateUserStatusRequest request, String adminEmail) {
        UserEntity admin = getAdminByEmail(adminEmail);
        UserEntity target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));

        // Prevent deactivating the last active SUPER_ADMIN
        if (target.getRole() == UserRole.SUPER_ADMIN && request.status() != UserStatus.ACTIVE) {
            long activeAdminCount = userRepository.countByRoleAndStatus(UserRole.SUPER_ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot deactivate or suspend the last active Super Admin account.");
            }
        }

        // Prevent activating unverified accounts
        if (request.status() == UserStatus.ACTIVE && !target.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cannot activate an unverified account. The user must verify their university email address first.");
        }

        UserStatus oldStatus = target.getStatus();
        target.setStatus(request.status());
        UserEntity updated = userRepository.save(target);

        String details = "Status changed from " + oldStatus + " to " + request.status();
        if (request.reason() != null && !request.reason().isBlank()) {
            details += ". Reason: " + request.reason().trim();
        }

        auditService.recordSuccess(
                admin.getId(),
                admin.getEmail(),
                "SUPER_ADMIN",
                "USER_STATUS_UPDATED",
                "USER",
                updated.getId().toString(),
                details);

        return mapToResponse(updated);
    }

    @Transactional
    public AdminUserResponse updateUserRole(UUID userId, UpdateUserRoleRequest request, String adminEmail) {
        UserEntity admin = getAdminByEmail(adminEmail);
        UserEntity target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userId));

        // Prevent demoting the last active SUPER_ADMIN
        if (target.getRole() == UserRole.SUPER_ADMIN && request.role() != UserRole.SUPER_ADMIN) {
            long activeAdminCount = userRepository.countByRoleAndStatus(UserRole.SUPER_ADMIN, UserStatus.ACTIVE);
            if (activeAdminCount <= 1) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot demote the last active Super Admin account.");
            }
        }

        // If transitioning to SECURITY_OFFICER, ensure an officer profile exists
        if (request.role() == UserRole.SECURITY_OFFICER) {
            Optional<SecurityOfficerProfileEntity> profileOpt = officerProfileRepository.findById(target.getId());
            if (profileOpt.isEmpty()) {
                SecurityOfficeEntity office = officeRepository.findFirstByActiveTrue()
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.INTERNAL_SERVER_ERROR, "Central Security Office is not configured."));
                SecurityOfficerProfileEntity profile = new SecurityOfficerProfileEntity(
                        target.getId(),
                        office,
                        request.badgeNumber() != null ? request.badgeNumber().trim() : null);
                officerProfileRepository.save(profile);
            } else if (request.badgeNumber() != null) {
                SecurityOfficerProfileEntity profile = profileOpt.get();
                profile.setBadgeNumber(request.badgeNumber().trim());
                officerProfileRepository.save(profile);
            }
        }

        UserRole oldRole = target.getRole();
        target.setRole(request.role());
        UserEntity updated = userRepository.save(target);

        String details = "Role changed from " + oldRole + " to " + request.role();
        if (request.reason() != null && !request.reason().isBlank()) {
            details += ". Reason: " + request.reason().trim();
        }

        auditService.recordSuccess(
                admin.getId(),
                admin.getEmail(),
                "SUPER_ADMIN",
                "USER_ROLE_UPDATED",
                "USER",
                updated.getId().toString(),
                details);

        return mapToResponse(updated);
    }

    private AdminUserResponse mapToResponse(UserEntity user) {
        String badgeNumber = null;
        UUID officeId = null;
        String officeName = null;

        if (user.getRole() == UserRole.SECURITY_OFFICER) {
            Optional<SecurityOfficerProfileEntity> profile = officerProfileRepository.findById(user.getId());
            if (profile.isPresent()) {
                badgeNumber = profile.get().getBadgeNumber();
                if (profile.get().getSecurityOffice() != null) {
                    officeId = profile.get().getSecurityOffice().getId();
                    officeName = profile.get().getSecurityOffice().getName();
                }
            }
        }

        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.getStatus(),
                user.isEmailVerified(),
                user.getIndexNumber(),
                user.getPhoneNumber(),
                user.isIndexNumberVerified(),
                badgeNumber,
                officeId,
                officeName,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private UserEntity getAdminByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Super Admin user not found."));
    }
}
