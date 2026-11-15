package com.campusfind.features.collection;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
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

    public CollectionService(
            ClaimRepository claimRepository,
            FoundItemRepository foundItemRepository,
            LostReportRepository lostReportRepository,
            LostReportAuditLogRepository lostReportAuditLogRepository,
            ItemCollectionLogRepository itemCollectionLogRepository,
            UserRepository userRepository,
            SecurityOfficerProfileRepository securityOfficerProfileRepository,
            ReputationService reputationService,
            ApplicationEventPublisher eventPublisher) {
        this.claimRepository = claimRepository;
        this.foundItemRepository = foundItemRepository;
        this.lostReportRepository = lostReportRepository;
        this.lostReportAuditLogRepository = lostReportAuditLogRepository;
        this.itemCollectionLogRepository = itemCollectionLogRepository;
        this.userRepository = userRepository;
        this.securityOfficerProfileRepository = securityOfficerProfileRepository;
        this.reputationService = reputationService;
        this.eventPublisher = eventPublisher;
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

        // Optional linked Lost Report transition
        UUID linkedLostReportId = null;
        LostReportStatus linkedLostReportStatus = null;
        LostReportEntity resolvedLostReport = null;

        if (request != null && request.linkedLostReportId() != null) {
            UUID reqReportId = request.linkedLostReportId();
            LostReportEntity lostReport = lostReportRepository.findById(reqReportId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked lost report not found: " + reqReportId));

            if (!lostReport.getStudent().getId().equals(claim.getClaimant().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Linked lost report does not belong to claimant");
            }

            if (lostReport.getStatus() != LostReportStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Linked lost report is not ACTIVE. Current status: " + lostReport.getStatus());
            }

            LostReportStatus previousStatus = lostReport.getStatus();
            lostReport.setStatus(LostReportStatus.RECOVERED);
            lostReport.setResolvedAt(now);
            lostReport.setResolvedBy(officer);
            lostReport.setResolutionNotes("Recovered via physical collection under Claim " + claim.getId());
            lostReportRepository.save(lostReport);

            LostReportAuditLogEntity auditLog = new LostReportAuditLogEntity(
                    lostReport,
                    officer.getId(),
                    officer.getRole().name(),
                    "RECOVERED_VIA_COLLECTION",
                    previousStatus != null ? previousStatus.name() : null,
                    LostReportStatus.RECOVERED.name(),
                    "Item collected from Central Security Office under Claim " + claim.getId()
            );
            lostReportAuditLogRepository.save(auditLog);

            linkedLostReportId = lostReport.getId();
            linkedLostReportStatus = lostReport.getStatus();
            resolvedLostReport = lostReport;
            log.info("Linked lost report {} transitioned to RECOVERED", lostReport.getId());
        }

        // Atomically transition Claim to COMPLETED
        claim.setStatus(ClaimStatus.COMPLETED);
        claim.setReviewedAt(now);
        claimRepository.save(claim);

        // Atomically transition Found Item to RETURNED
        item.setAvailabilityStatus(ItemAvailabilityStatus.RETURNED);
        foundItemRepository.save(item);

        // Save immutable collection log record
        String notes = (request != null && request.officerNotes() != null) ? request.officerNotes().trim() : null;
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

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }
}
