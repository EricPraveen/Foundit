package com.campusfind.features.notification;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.features.claim.ClaimService;
import com.campusfind.features.claim.dto.ApproveClaimRequest;
import com.campusfind.features.collection.CollectionService;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.features.item.FoundItemService;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.CategoryReputationRuleRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemHandoverLogRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.HandoverReminderLogRepository;
import com.campusfind.infrastructure.persistence.repository.ItemCollectionLogRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.NotificationEmailDeliveryRepository;
import com.campusfind.infrastructure.persistence.repository.NotificationRepository;
import com.campusfind.infrastructure.persistence.repository.ReputationTransactionRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UnclaimedEscalationLogRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class NotificationEventWorkflowIntegrationTest {

    @Autowired
    private FoundItemService foundItemService;

    @Autowired
    private ClaimService claimService;

    @Autowired
    private CollectionService collectionService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationEmailDeliveryRepository emailDeliveryRepository;

    @Autowired
    private HandoverReminderLogRepository handoverReminderLogRepository;

    @Autowired
    private UnclaimedEscalationLogRepository unclaimedEscalationLogRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

    @Autowired
    private ReputationTransactionRepository reputationTransactionRepository;

    @Autowired
    private CategoryReputationRuleRepository categoryReputationRuleRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private FoundItemHandoverLogRepository handoverLogRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserEntity studentFinder;
    private UserEntity studentClaimant;
    private UserEntity officerUser;
    private SecurityOfficeEntity testOffice;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;

    @BeforeEach
    void setUp() {
        tearDown();

        studentFinder = new UserEntity("finder@uom.lk", passwordEncoder.encode("Pass1234!"), "Finder Student", UserRole.STUDENT);
        studentFinder.setEmailVerified(true);
        userRepository.save(studentFinder);

        studentClaimant = new UserEntity("claimant@uom.lk", passwordEncoder.encode("Pass1234!"), "Claimant Student", UserRole.STUDENT);
        studentClaimant.setEmailVerified(true);
        userRepository.save(studentClaimant);

        testOffice = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "secA@uom.lk", "+94112650001", "24/7");
        officeRepository.save(testOffice);

        officerUser = new UserEntity("officer@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Dan", UserRole.SECURITY_OFFICER);
        officerUser.setEmailVerified(true);
        userRepository.save(officerUser);

        SecurityOfficerProfileEntity profile = new SecurityOfficerProfileEntity(officerUser.getId(), testOffice, "SEC-123");
        officerProfileRepository.save(profile);

        testCategory = new CategoryEntity("Electronics", "Gadgets and devices", true);
        categoryRepository.save(testCategory);

        CategoryReputationRuleEntity rule = new CategoryReputationRuleEntity(
                testCategory, ReputationTransactionType.FOUND_ITEM_HANDOVER, 15, true);
        categoryReputationRuleRepository.save(rule);

        testLocation = new LocationEntity("Library", "Main Library", "Academic", true);
        locationRepository.save(testLocation);
    }

    @AfterEach
    void tearDown() {
        emailDeliveryRepository.deleteAll();
        notificationRepository.deleteAll();
        handoverReminderLogRepository.deleteAll();
        unclaimedEscalationLogRepository.deleteAll();
        itemCollectionLogRepository.deleteAll();
        reputationTransactionRepository.deleteAll();
        categoryReputationRuleRepository.deleteAll();
        claimEvidenceRepository.deleteAll();
        claimRepository.deleteAll();
        handoverLogRepository.deleteAll();
        foundItemRepository.deleteAll();
        lostReportAuditLogRepository.deleteAll();
        lostReportRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
    }

    @Test
    @DisplayName("Reporting found item triggers FOUND_ITEM_REPORTED notification and email delivery record")
    void testFoundItemReported_TriggersNotification() {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Lost Smartwatch",
                "Found near library desk",
                testCategory.getId(),
                testLocation.getId(),
                "Table 4",
                Instant.now().minus(1, ChronoUnit.HOURS),
                testOffice.getId()
        );

        foundItemService.reportFoundItem(studentFinder.getEmail(), request);

        List<NotificationEntity> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId());
        assertEquals(1, notifs.size());
        assertEquals(NotificationType.FOUND_ITEM_REPORTED, notifs.get(0).getNotificationType());
        assertFalse(notifs.get(0).isRead());

        // Verify email delivery record was queued
        assertFalse(emailDeliveryRepository.findAll().isEmpty());
    }

    @Test
    @DisplayName("Handover confirmation triggers FOUND_ITEM_HANDOVER_CONFIRMED and REPUTATION_AWARDED notifications")
    void testHandoverConfirmed_TriggersNotifications() {
        FoundItemEntity item = new FoundItemEntity(
                "Blue Backpack", "Found at canteen", testCategory, testLocation,
                "Desk 2", Instant.now().minus(2, ChronoUnit.HOURS), studentFinder, testOffice);
        foundItemRepository.save(item);

        ConfirmHandoverRequest handoverRequest = new ConfirmHandoverRequest("Verified at desk");
        foundItemService.confirmHandover(item.getId(), officerUser.getEmail(), handoverRequest);

        List<NotificationEntity> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId());
        assertEquals(2, notifs.size());

        boolean hasHandoverNotif = notifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.FOUND_ITEM_HANDOVER_CONFIRMED);
        boolean hasReputationNotif = notifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.REPUTATION_AWARDED);

        assertTrue(hasHandoverNotif);
        assertTrue(hasReputationNotif);
    }

    @Test
    @DisplayName("Claim lifecycle triggers CLAIM_SUBMITTED and CLAIM_APPROVED notifications")
    void testClaimLifecycle_TriggersNotifications() {
        FoundItemEntity item = new FoundItemEntity(
                "Silver Laptop", "Found in lab", testCategory, testLocation,
                "Desk 3", Instant.now().minus(2, ChronoUnit.HOURS), studentFinder, testOffice);
        item.setHandoverStatus(HandoverStatus.CONFIRMED);
        item.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(item);

        // 1. Submit Claim
        MockMultipartFile idCard = new MockMultipartFile("studentIdCard", "id.jpg", "image/jpeg", new byte[]{1, 2, 3});
        MockMultipartFile proof = new MockMultipartFile("ownershipProof", "receipt.jpg", "image/jpeg", new byte[]{4, 5, 6});
        var claimResp = claimService.submitClaim(
                item.getId(),
                studentClaimant.getEmail(),
                "210001B",
                "My laptop with sticker",
                idCard,
                proof,
                null
        );

        List<NotificationEntity> claimantNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentClaimant.getId());
        assertEquals(1, claimantNotifs.size());
        assertEquals(NotificationType.CLAIM_SUBMITTED, claimantNotifs.get(0).getNotificationType());

        // 2. Approve Claim
        ApproveClaimRequest approveReq = new ApproveClaimRequest("Serial number matched");
        claimService.officerApproveClaim(claimResp.id(), officerUser.getEmail(), approveReq);

        claimantNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentClaimant.getId());
        assertEquals(2, claimantNotifs.size());
        assertEquals(NotificationType.CLAIM_APPROVED, claimantNotifs.get(0).getNotificationType());
    }

    @Test
    @DisplayName("Physical collection confirmation notifies claimant, finder, and links recovered lost report")
    void testCollectionConfirmed_TriggersAllNotifications() {
        FoundItemEntity item = new FoundItemEntity(
                "Casio Watch", "Found in hall", testCategory, testLocation,
                "Desk 4", Instant.now().minus(2, ChronoUnit.HOURS), studentFinder, testOffice);
        item.setHandoverStatus(HandoverStatus.CONFIRMED);
        item.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(item);

        ClaimEntity claim = new ClaimEntity(item, studentClaimant, "210001B", "My casio watch");
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewingOfficer(officerUser);
        claim.setReviewedAt(Instant.now());
        claimRepository.save(claim);

        LostReportEntity lostReport = new LostReportEntity(
                "My Lost Casio Watch", "Lost during exam", "Scratched dial",
                testCategory, testLocation, "Main Hall",
                Instant.now().minus(3, ChronoUnit.DAYS), studentClaimant, testOffice);
        lostReportRepository.save(lostReport);

        ConfirmCollectionRequest req = new ConfirmCollectionRequest(
                "Collected by student with valid ID",
                lostReport.getId()
        );

        collectionService.confirmCollection(claim.getId(), officerUser.getEmail(), req);

        // Claimant received COLLECTION_CONFIRMED and LOST_REPORT_RECOVERED
        List<NotificationEntity> claimantNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentClaimant.getId());
        assertTrue(claimantNotifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.COLLECTION_CONFIRMED));
        assertTrue(claimantNotifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.LOST_REPORT_RECOVERED));

        // Finder received COLLECTION_CONFIRMED
        List<NotificationEntity> finderNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId());
        assertTrue(finderNotifs.stream().anyMatch(n -> n.getNotificationType() == NotificationType.COLLECTION_CONFIRMED));
    }
}
