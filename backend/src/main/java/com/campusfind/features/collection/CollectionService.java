package com.campusfind.features.collection;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.audit.AuditService;
import com.campusfind.features.collection.dto.CollectionConfirmationResponse;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.features.notification.event.CollectionConfirmedEvent;
import com.campusfind.features.reputation.ReputationService;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.ItemCollectionLogEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportAuditLogEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.ItemCollectionLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CollectionService {

    private static final Logger log = LoggerFactory.getLogger(CollectionService.class);

    private final ClaimRepository claimRepository;
    private final FoundItemRepository foundItemRepository;
    private final LostReportRepository lostReportRepository;
    private final LostReportAuditLogRepository lostReportAuditLogRepository;
    private final ItemCollectionLogRepository itemCollectionLogRepository;
    private final UserRepository userRepository;
    private final SecurityOfficerProfileRepository securityOfficerProfileRepository;
    private final ReputationService reputationService;
    private final ApplicationEventPublisher eventPublisher;
    private final AuditService auditService;

    public CollectionService(
            ClaimRepository claimRepository,
            FoundItemRepository foundItemRepository,
            LostReportRepository lostReportRepository,
            LostReportAuditLogRepository lostReportAuditLogRepository,
            ItemCollectionLogRepository itemCollectionLogRepository,
            UserRepository userRepository,
            SecurityOfficerProfileRepository securityOfficerProfileRepository,
            ReputationService reputationService,
            ApplicationEventPublisher eventPublisher,
            AuditService auditService) {
        this.claimRepository = claimRepository;
        this.foundItemRepository = foundItemRepository;
        this.lostReportRepository = lostReportRepository;
        this.lostReportAuditLogRepository = lostReportAuditLogRepository;
        this.itemCollectionLogRepository = itemCollectionLogRepository;
        this.userRepository = userRepository;
        this.securityOfficerProfileRepository = securityOfficerProfileRepository;
        this.reputationService = reputationService;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Transactional
    public CollectionConfirmationResponse confirmCollection(
            UUID claimId, String officerEmail, ConfirmCollectionRequest request) {

        UserEntity officer = getUserByEmail(officerEmail);
        if (officer.getRole() != UserRole.SECURITY_OFFICER && officer.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only security officers or administrators can confirm physical collection");
        }

        ClaimEntity claim = claimRepository.findById(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Claim not found: " + claimId));

        // Concurrency protection: pessimistic write lock on the associated found item
        FoundItemEntity item = foundItemRepository.findByIdForUpdate(claim.getFoundItem().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found for claim: " + claimId));

        // Office scope boundary check
        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officer.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured"));

            if (!profile.getSecurityOffice().getId().equals(item.getDesignatedSecurityOffice().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this item");
            }
        }

        // Validate claim and item states
        if (claim.getStatus() == ClaimStatus.COMPLETED || item.getAvailabilityStatus() == ItemAvailabilityStatus.RETURNED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Collection has already been confirmed for this claim/item");
        }

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only APPROVED claims can be confirmed for physical collection. Current status: " + claim.getStatus());
        }

        if (item.getAvailabilityStatus() != ItemAvailabilityStatus.CLAIM_PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Found item is not in reserved status (CLAIM_PENDING). Current status: " + item.getAvailabilityStatus());
        }

        if (itemCollectionLogRepository.existsByClaimId(claimId) || itemCollectionLogRepository.existsByFoundItemId(item.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A collection record already exists for this claim or found item");
        }

        Instant now = Instant.now();
        String notes = request != null && request.officerNotes() != null ? request.officerNotes().trim() : null;

        // Atomically update claim status to COMPLETED
        claim.setStatus(ClaimStatus.COMPLETED);
        claim.setReviewedAt(now);
        claimRepository.save(claim);

        // Atomically update found item availability to RETURNED
        item.setAvailabilityStatus(ItemAvailabilityStatus.RETURNED);
        foundItemRepository.save(item);

        // If a linked lost report was provided, transition it to RECOVERED
        UUID linkedLostReportId = request != null ? request.linkedLostReportId() : null;
        LostReportStatus linkedLostReportStatus = null;
        LostReportEntity resolvedLostReport = null;

        if (linkedLostReportId != null) {
            LostReportEntity lostReport = lostReportRepository.findById(linkedLostReportId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked lost report not found: " + linkedLostReportId));

            // Validate that the linked lost report belongs to the claimant
            if (!lostReport.getStudent().getId().equals(claim.getClaimant().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked lost report does not belong to the claiming student");
            }

            // Must be in ACTIVE status to recover
            if (lostReport.getStatus() != LostReportStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Linked lost report is already in terminal state: " + lostReport.getStatus());
            }

            lostReport.setStatus(LostReportStatus.RECOVERED);
            lostReport.setResolvedAt(now);
            lostReport.setResolvedBy(officer);
            lostReportRepository.save(lostReport);
            resolvedLostReport = lostReport;
            linkedLostReportStatus = lostReport.getStatus();

            // Audit the lost report transition
            LostReportAuditLogEntity auditLog = new LostReportAuditLogEntity(
                    lostReport,
                    officer.getId(),
                    officer.getRole().name(),
                    "RECOVERED_VIA_COLLECTION",
                    LostReportStatus.ACTIVE.name(),
                    LostReportStatus.RECOVERED.name(),
                    "Physical collection confirmed at Central Security Office; recovered via claim " + claimId
            );
            lostReportAuditLogRepository.save(auditLog);
        }

        // Record immutable physical collection audit log
        ItemCollectionLogEntity logEntity = new ItemCollectionLogEntity(
                claim,
                item,
                claim.getClaimant(),
                officer,
                item.getDesignatedSecurityOffice(),
                now,
                notes
        );
        ItemCollectionLogEntity savedLog = itemCollectionLogRepository.save(logEntity);

        // Award eligible collection reputation points (if configured)
        int pointsAwarded = reputationService.awardCollectionPoints(claim, item, officer);

        // Publish collection confirmed event
        eventPublisher.publishEvent(new CollectionConfirmedEvent(claim, item, officer, resolvedLostReport, pointsAwarded));

        // Record centralized audit log
        auditService.recordSuccess(
                officer.getId(),
                officer.getEmail(),
                officer.getRole().name(),
                "COLLECTION_CONFIRMED",
                "COLLECTION",
                savedLog.getId().toString(),
                "Physical collection confirmed for claim " + claim.getId() + " and item " + item.getId() +
                        (notes != null ? ". Notes: " + notes : ""));

        log.info("Collection confirmed for claim {} and item {} by officer {}", claim.getId(), item.getId(), officer.getId());

        return new CollectionConfirmationResponse(
                savedLog.getId(),
                claim.getId(),
                item.getId(),
                claim.getClaimant().getId(),
                claim.getClaimant().getFullName(),
                claim.getClaimant().getEmail(),
                officer.getId(),
                officer.getFullName(),
                now,
                claim.getStatus(),
                item.getAvailabilityStatus(),
                linkedLostReportId,
                linkedLostReportStatus,
                notes,
                pointsAwarded
        );
    }

    @Transactional(readOnly = true)
    public CollectionConfirmationResponse getCollectionByClaimId(UUID claimId, String officerEmail) {
        UserEntity officerUser = getUserByEmail(officerEmail);
        ItemCollectionLogEntity log = itemCollectionLogRepository.findByClaimId(claimId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection record not found for claim: " + claimId));

        validateOfficerOfficeScope(officerUser, log.getSecurityOffice().getId());

        return mapToCollectionResponse(log);
    }

    @Transactional(readOnly = true)
    public CollectionConfirmationResponse getCollectionByFoundItemId(UUID foundItemId, String officerEmail) {
        UserEntity officerUser = getUserByEmail(officerEmail);
        ItemCollectionLogEntity log = itemCollectionLogRepository.findByFoundItemId(foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection record not found for found item: " + foundItemId));

        validateOfficerOfficeScope(officerUser, log.getSecurityOffice().getId());

        return mapToCollectionResponse(log);
    }

    private void validateOfficerOfficeScope(UserEntity officerUser, UUID officeId) {
        if (officerUser.getRole() == UserRole.SECURITY_OFFICER) {
            SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officerUser.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured."));

            if (!profile.getSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Collection record is outside your assigned security office scope.");
            }
        }
    }

    private CollectionConfirmationResponse mapToCollectionResponse(ItemCollectionLogEntity log) {
        return new CollectionConfirmationResponse(
                log.getId(),
                log.getClaim().getId(),
                log.getFoundItem().getId(),
                log.getClaimant().getId(),
                log.getClaimant().getFullName(),
                log.getClaimant().getEmail(),
                log.getOfficer().getId(),
                log.getOfficer().getFullName(),
                log.getCollectedAt(),
                log.getClaim().getStatus(),
                log.getFoundItem().getAvailabilityStatus(),
                null,
                null,
                log.getOfficerNotes(),
                0
        );
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }
}
