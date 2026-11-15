package com.campusfind.features.claim;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.claim.EvidenceType;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.features.claim.dto.ApproveClaimRequest;
import com.campusfind.features.claim.dto.ClaimEvidenceResponse;
import com.campusfind.features.claim.dto.ClaimResponse;
import com.campusfind.features.claim.dto.ClaimSummaryResponse;
import com.campusfind.features.claim.dto.ClaimantSummary;
import com.campusfind.features.claim.dto.DownloadedEvidence;
import com.campusfind.features.claim.dto.RejectClaimRequest;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEvidenceEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.storage.StorageService;
import com.campusfind.infrastructure.storage.StoredFile;
import jakarta.persistence.criteria.Predicate;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ClaimService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "application/pdf"
    );

    private final ClaimRepository claimRepository;
    private final ClaimEvidenceRepository claimEvidenceRepository;
    private final FoundItemRepository foundItemRepository;
    private final UserRepository userRepository;
    private final SecurityOfficerProfileRepository securityOfficerProfileRepository;
    private final StorageService storageService;
    private final String storageBucket;

    public ClaimService(
            ClaimRepository claimRepository,
            ClaimEvidenceRepository claimEvidenceRepository,
            FoundItemRepository foundItemRepository,
            UserRepository userRepository,
            SecurityOfficerProfileRepository securityOfficerProfileRepository,
            StorageService storageService,
            @Value("${app.storage.bucket:campusfind-storage}") String storageBucket) {
        this.claimRepository = claimRepository;
        this.claimEvidenceRepository = claimEvidenceRepository;
        this.foundItemRepository = foundItemRepository;
        this.userRepository = userRepository;
        this.securityOfficerProfileRepository = securityOfficerProfileRepository;
        this.storageService = storageService;
        this.storageBucket = storageBucket;
    }

    @Transactional
    public ClaimResponse submitClaim(
            UUID foundItemId,
            String studentEmail,
            String indexNumber,
            String ownershipDescription,
            MultipartFile studentIdCard,
            MultipartFile ownershipProof,
            MultipartFile additionalProof) {

        UserEntity student = getUserByEmail(studentEmail);

        FoundItemEntity foundItem = foundItemRepository.findById(foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + foundItemId));

        // Found Item must be verified and in AVAILABLE status
        if (foundItem.getHandoverStatus() != HandoverStatus.CONFIRMED ||
                foundItem.getAvailabilityStatus() != ItemAvailabilityStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Item is not currently available for claims");
        }

        // The finder cannot submit an ownership claim on the item they reported finding
        if (foundItem.getFinder().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot submit a claim for an item you reported finding");
        }

        // Check for existing active or approved claim by this student on this item
        if (claimRepository.existsByFoundItemIdAndClaimantIdAndStatusIn(
                foundItemId, student.getId(), List.of(ClaimStatus.PENDING, ClaimStatus.APPROVED))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active or approved claim for this item");
        }

        // Validate text fields
        if (indexNumber == null || indexNumber.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Index number is required");
        }
        if (ownershipDescription == null || ownershipDescription.trim().length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ownership description must be at least 10 characters");
        }

        // Validate required evidence files
        validateEvidenceFile(studentIdCard, "Student ID card image is required");
        validateEvidenceFile(ownershipProof, "Ownership proof document/image is required");
        if (additionalProof != null && !additionalProof.isEmpty()) {
            validateEvidenceFile(additionalProof, "Additional proof");
        }

        ClaimEntity claim = new ClaimEntity(
                foundItem,
                student,
                indexNumber.trim(),
                ownershipDescription.trim()
        );

        ClaimEntity savedClaim = claimRepository.save(claim);

        // Store Student ID Card evidence
        storeEvidence(savedClaim, EvidenceType.STUDENT_ID_CARD, studentIdCard);

        // Store Ownership Proof evidence
        storeEvidence(savedClaim, EvidenceType.OWNERSHIP_PROOF, ownershipProof);

        // Store Additional Proof evidence (if provided)
        if (additionalProof != null && !additionalProof.isEmpty()) {
            storeEvidence(savedClaim, EvidenceType.ADDITIONAL_PROOF, additionalProof);
        }

        return mapToResponse(savedClaim);
    }

    @Transactional(readOnly = true)
    public Page<ClaimSummaryResponse> getMyClaims(String studentEmail, Pageable pageable) {
        UserEntity student = getUserByEmail(studentEmail);
        Page<ClaimEntity> claims = claimRepository.findByClaimantIdOrderBySubmittedAtDesc(student.getId(), pageable);
        return claims.map(this::mapToSummaryResponse);
    }

    @Transactional(readOnly = true)
    public ClaimResponse getClaimById(UUID claimId, String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (user.getRole() == UserRole.STUDENT) {
            if (!claim.getClaimant().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId);
            }
        } else if (user.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(user.getId());
            if (!claim.getFoundItem().getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the security office for this item");
            }
        }

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse cancelClaim(UUID claimId, String studentEmail) {
        UserEntity student = getUserByEmail(studentEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (!claim.getClaimant().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId);
        }

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel a claim with status: " + claim.getStatus());
        }

        claim.setStatus(ClaimStatus.CANCELLED);
        claim.setCancelledAt(Instant.now());

        ClaimEntity saved = claimRepository.save(claim);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public DownloadedEvidence getEvidenceFile(UUID claimId, UUID evidenceId, String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (user.getRole() == UserRole.STUDENT) {
            if (!claim.getClaimant().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId);
            }
        } else if (user.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(user.getId());
            if (!claim.getFoundItem().getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the security office for this item");
            }
        }

        ClaimEvidenceEntity evidence = claimEvidenceRepository.findByIdAndClaimId(evidenceId, claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evidence not found: " + evidenceId));

        byte[] data = storageService.download(storageBucket, evidence.getStoragePath());
        return new DownloadedEvidence(evidence.getOriginalFilename(), evidence.getContentType(), data);
    }

    // --- Officer APIs ---

    @Transactional(readOnly = true)
    public Page<ClaimResponse> officerListClaims(
            String officerEmail,
            ClaimStatus status,
            UUID itemId,
            Pageable pageable) {

        UserEntity officer = getUserByEmail(officerEmail);
        UUID officeId = null;

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            officeId = getOfficerOfficeId(officer.getId());
        }

        final UUID finalOfficeId = officeId;

        Specification<ClaimEntity> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (finalOfficeId != null) {
                predicates.add(cb.equal(root.get("foundItem").get("designatedSecurityOffice").get("id"), finalOfficeId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (itemId != null) {
                predicates.add(cb.equal(root.get("foundItem").get("id"), itemId));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ClaimEntity> results = claimRepository.findAll(spec, pageable);
        return results.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public ClaimResponse officerGetClaimById(UUID claimId, String officerEmail) {
        UserEntity officer = getUserByEmail(officerEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!claim.getFoundItem().getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the security office for this item");
            }
        }

        return mapToResponse(claim);
    }

    @Transactional
    public ClaimResponse officerApproveClaim(UUID claimId, String officerEmail, ApproveClaimRequest request) {
        UserEntity officer = getUserByEmail(officerEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!claim.getFoundItem().getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the security office for this item");
            }
        }

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot approve a claim with status: " + claim.getStatus());
        }

        // Concurrency-safe approval: Pessimistic write lock on the Found Item ensures serialized evaluation
        FoundItemEntity foundItem = foundItemRepository.findByIdForUpdate(claim.getFoundItem().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found"));

        // Verify that no other active approved claim exists for this item
        if (claimRepository.existsByFoundItemIdAndStatus(foundItem.getId(), ClaimStatus.APPROVED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Another claim has already been approved for this item");
        }

        // Verify found item availability status
        if (foundItem.getAvailabilityStatus() != ItemAvailabilityStatus.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Found item is no longer available for approval");
        }

        Instant now = Instant.now();
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewingOfficer(officer);
        claim.setReviewedAt(now);
        claim.setReviewNotes(request != null && request.reviewNotes() != null ? request.reviewNotes().trim() : null);

        // Reserve the found item for the approved claimant
        foundItem.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(foundItem);

        ClaimEntity savedClaim = claimRepository.save(claim);
        return mapToResponse(savedClaim);
    }

    @Transactional
    public ClaimResponse officerRejectClaim(UUID claimId, String officerEmail, RejectClaimRequest request) {
        UserEntity officer = getUserByEmail(officerEmail);
        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!claim.getFoundItem().getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the security office for this item");
            }
        }

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot reject a claim with status: " + claim.getStatus());
        }

        if (request == null || request.rejectionReason() == null || request.rejectionReason().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }

        claim.setStatus(ClaimStatus.REJECTED);
        claim.setReviewingOfficer(officer);
        claim.setReviewedAt(Instant.now());
        claim.setRejectionReason(request.rejectionReason().trim());

        ClaimEntity savedClaim = claimRepository.save(claim);
        return mapToResponse(savedClaim);
    }

    // --- Helpers ---

    private void validateEvidenceFile(MultipartFile file, String errorContext) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, errorContext);
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file format for " + errorContext + ". Allowed: JPEG, PNG, WebP, PDF");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size for " + errorContext + " exceeds 5 MB limit");
        }
    }

    private void storeEvidence(ClaimEntity claim, EvidenceType type, MultipartFile file) {
        String contentType = file.getContentType();
        String extension = getExtension(file.getOriginalFilename(), contentType);
        String storagePath = "claims/" + claim.getId() + "/" + type.name().toLowerCase() + "_" + UUID.randomUUID() + extension;

        try {
            storageService.upload(storageBucket, storagePath, file.getBytes(), contentType);

            ClaimEvidenceEntity evidenceEntity = new ClaimEvidenceEntity(
                    claim,
                    type,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : type.name() + extension,
                    storagePath,
                    contentType,
                    file.getSize()
            );

            ClaimEvidenceEntity saved = claimEvidenceRepository.save(evidenceEntity);
            claim.getEvidenceList().add(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read evidence file content", e);
        }
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
    }

    private UUID getOfficerOfficeId(UUID officerId) {
        SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured"));
        return profile.getSecurityOffice().getId();
    }

    private ClaimResponse mapToResponse(ClaimEntity entity) {
        List<ClaimEvidenceResponse> evidenceResponses = entity.getEvidenceList().stream()
                .map(this::mapToEvidenceResponse)
                .toList();

        ClaimantSummary claimantSummary = new ClaimantSummary(
                entity.getClaimant().getId(),
                entity.getClaimant().getFullName(),
                entity.getClaimant().getEmail(),
                entity.getClaimant().getPhoneNumber(),
                entity.getIndexNumber()
        );

        return new ClaimResponse(
                entity.getId(),
                entity.getFoundItem().getId(),
                entity.getFoundItem().getTitle(),
                entity.getFoundItem().getDesignatedSecurityOffice().getId(),
                entity.getFoundItem().getDesignatedSecurityOffice().getName(),
                claimantSummary,
                entity.getOwnershipDescription(),
                entity.getStatus(),
                entity.getReviewingOfficer() != null ? entity.getReviewingOfficer().getId() : null,
                entity.getReviewingOfficer() != null ? entity.getReviewingOfficer().getFullName() : null,
                entity.getReviewNotes(),
                entity.getRejectionReason(),
                entity.getSubmittedAt(),
                entity.getReviewedAt(),
                entity.getCancelledAt(),
                evidenceResponses,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private ClaimSummaryResponse mapToSummaryResponse(ClaimEntity entity) {
        return new ClaimSummaryResponse(
                entity.getId(),
                entity.getFoundItem().getId(),
                entity.getFoundItem().getTitle(),
                entity.getStatus(),
                entity.getSubmittedAt(),
                entity.getReviewedAt()
        );
    }

    private ClaimEvidenceResponse mapToEvidenceResponse(ClaimEvidenceEntity entity) {
        return new ClaimEvidenceResponse(
                entity.getId(),
                entity.getClaim().getId(),
                entity.getEvidenceType(),
                entity.getOriginalFilename(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    private String getExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
    }
}
