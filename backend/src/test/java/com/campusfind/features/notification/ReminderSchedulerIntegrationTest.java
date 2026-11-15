package com.campusfind.features.notification;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.notification.EmailDeliveryStatus;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.features.notification.scheduler.ReminderSchedulerService;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEmailDeliveryEntity;
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
class ReminderSchedulerIntegrationTest {

    @Autowired
    private ReminderSchedulerService reminderSchedulerService;

    @Autowired
    private NotificationProperties notificationProperties;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationEmailDeliveryRepository emailDeliveryRepository;

    @Autowired
    private HandoverReminderLogRepository handoverReminderLogRepository;

    @Autowired
    private UnclaimedEscalationLogRepository unclaimedEscalationLogRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private FoundItemHandoverLogRepository handoverLogRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

    @Autowired
    private ReputationTransactionRepository reputationTransactionRepository;

    @Autowired
    private CategoryReputationRuleRepository categoryReputationRuleRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UserEntity studentFinder;
    private UserEntity securityOfficerUser;
    private UserEntity superAdminUser;
    private SecurityOfficeEntity testOffice;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;

    @BeforeEach
    void setUp() {
        tearDown();

        studentFinder = new UserEntity("finder@uom.lk", passwordEncoder.encode("Pass1234!"), "Finder Student", UserRole.STUDENT);
        studentFinder.setEmailVerified(true);
        userRepository.save(studentFinder);

        testOffice = new SecurityOfficeEntity("Central Security Desk", "Security Bldg Room 101", "sec@uom.lk", "0112345678", "Mon-Fri 08:00-16:00");
        officeRepository.save(testOffice);

        securityOfficerUser = new UserEntity("officer@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Dan", UserRole.SECURITY_OFFICER);
        securityOfficerUser.setEmailVerified(true);
        userRepository.save(securityOfficerUser);

        SecurityOfficerProfileEntity officerProfile = new SecurityOfficerProfileEntity(securityOfficerUser.getId(), testOffice, "SEC-0099");
        officerProfileRepository.save(officerProfile);

        superAdminUser = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1234!"), "Admin Jane", UserRole.SUPER_ADMIN);
        superAdminUser.setEmailVerified(true);
        userRepository.save(superAdminUser);

        testCategory = new CategoryEntity("Electronics", "Electronic gadgets", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Library", "Main campus library", "Academic", true);
        locationRepository.save(testLocation);
    }

    @AfterEach
    void tearDown() {
        notificationProperties.setUnclaimedEnabled(false);
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
    @DisplayName("Handover reminder is sent for items pending > 24 hours and is idempotent")
    void testHandoverReminder_SentAndIdempotent() {
        FoundItemEntity pendingItem = new FoundItemEntity(
                "Lost Calculator",
                "Scientific calculator left in hall",
                testCategory,
                testLocation,
                "Desk 1",
                Instant.now().minus(26, ChronoUnit.HOURS),
                studentFinder,
                testOffice
        );
        pendingItem.setCreatedAt(Instant.now().minus(26, ChronoUnit.HOURS));
        foundItemRepository.save(pendingItem);

        // Run scheduler
        int count = reminderSchedulerService.processPendingHandoverReminders();
        assertEquals(1, count);

        // Check in-app notification
        List<NotificationEntity> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId());
        assertEquals(1, notifs.size());
        assertEquals(NotificationType.HANDOVER_REMINDER, notifs.get(0).getNotificationType());

        // Check log recorded
        assertTrue(handoverReminderLogRepository.existsByFoundItemIdAndCycleNumber(pendingItem.getId(), 1));

        // Running again must be idempotent (no duplicate notifications or logs)
        int reCount = reminderSchedulerService.processPendingHandoverReminders();
        assertEquals(0, reCount);
        assertEquals(1, notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId()).size());
    }

    @Test
    @DisplayName("Handover reminder is NOT sent if item is younger than 24 hours or already confirmed")
    void testHandoverReminder_YoungOrConfirmed_NotSent() {
        FoundItemEntity youngItem = new FoundItemEntity(
                "Young Item",
                "Reported 5 hours ago",
                testCategory,
                testLocation,
                "Desk 2",
                Instant.now().minus(5, ChronoUnit.HOURS),
                studentFinder,
                testOffice
        );
        youngItem.setCreatedAt(Instant.now().minus(5, ChronoUnit.HOURS));
        foundItemRepository.save(youngItem);

        FoundItemEntity confirmedItem = new FoundItemEntity(
                "Confirmed Item",
                "Already in custody",
                testCategory,
                testLocation,
                "Desk 3",
                Instant.now().minus(30, ChronoUnit.HOURS),
                studentFinder,
                testOffice
        );
        confirmedItem.setCreatedAt(Instant.now().minus(30, ChronoUnit.HOURS));
        confirmedItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        confirmedItem.setHandoverConfirmedAt(Instant.now().minus(28, ChronoUnit.HOURS));
        confirmedItem.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(confirmedItem);

        int count = reminderSchedulerService.processPendingHandoverReminders();
        assertEquals(0, count);
        assertTrue(notificationRepository.findByRecipientIdOrderByCreatedAtDesc(studentFinder.getId()).isEmpty());
    }

    @Test
    @DisplayName("Unclaimed escalation does nothing when unclaimed-enabled is false (default)")
    void testUnclaimedEscalation_DisabledByDefault() {
        notificationProperties.setUnclaimedEnabled(false);

        FoundItemEntity oldItem = new FoundItemEntity(
                "Old Unclaimed Umbrella",
                "Sitting in office for months",
                testCategory,
                testLocation,
                "Desk 4",
                Instant.now().minus(35, ChronoUnit.DAYS),
                studentFinder,
                testOffice
        );
        oldItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        oldItem.setHandoverConfirmedAt(Instant.now().minus(35, ChronoUnit.DAYS));
        oldItem.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(oldItem);

        int count = reminderSchedulerService.processUnclaimedEscalations();
        assertEquals(0, count);

        FoundItemEntity itemAfter = foundItemRepository.findById(oldItem.getId()).orElseThrow();
        assertEquals(ItemAvailabilityStatus.AVAILABLE, itemAfter.getAvailabilityStatus());
        assertFalse(unclaimedEscalationLogRepository.existsByFoundItemId(oldItem.getId()));
    }

    @Test
    @DisplayName("Unclaimed escalation transitions items past threshold to UNCLAIMED, alerts officers and admins without disposing item")
    void testUnclaimedEscalation_Enabled_TransitionsAndAlerts() {
        notificationProperties.setUnclaimedEnabled(true);
        notificationProperties.setUnclaimedThresholdDays(30);

        FoundItemEntity oldItem = new FoundItemEntity(
                "Old Unclaimed Watch",
                "Wristwatch unclaimed past policy limit",
                testCategory,
                testLocation,
                "Desk 5",
                Instant.now().minus(32, ChronoUnit.DAYS),
                studentFinder,
                testOffice
        );
        oldItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        oldItem.setHandoverConfirmedAt(Instant.now().minus(32, ChronoUnit.DAYS));
        oldItem.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(oldItem);

        int count = reminderSchedulerService.processUnclaimedEscalations();
        assertEquals(1, count);

        // Verify status transitioned to UNCLAIMED
        FoundItemEntity escalatedItem = foundItemRepository.findById(oldItem.getId()).orElseThrow();
        assertEquals(ItemAvailabilityStatus.UNCLAIMED, escalatedItem.getAvailabilityStatus());
        assertTrue(unclaimedEscalationLogRepository.existsByFoundItemId(oldItem.getId()));

        // Verify Security Officer was notified
        List<NotificationEntity> officerNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(securityOfficerUser.getId());
        assertEquals(1, officerNotifs.size());
        assertEquals(NotificationType.UNCLAIMED_ESCALATION, officerNotifs.get(0).getNotificationType());

        // Verify Super Admin was notified
        List<NotificationEntity> adminNotifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(superAdminUser.getId());
        assertEquals(1, adminNotifs.size());
        assertEquals(NotificationType.UNCLAIMED_ESCALATION, adminNotifs.get(0).getNotificationType());

        // Verify running again is idempotent
        int reCount = reminderSchedulerService.processUnclaimedEscalations();
        assertEquals(0, reCount);
    }

    @Test
    @DisplayName("Email retry mechanism processes pending retries and transitions to FAILED when max retries exceeded")
    void testEmailRetry() {
        notificationProperties.setMaxEmailRetries(3);

        NotificationEmailDeliveryEntity delivery = new NotificationEmailDeliveryEntity(
                null,
                "student@uom.lk",
                "Test Subject",
                "Test Body"
        );
        delivery.setStatus(EmailDeliveryStatus.RETRY_SCHEDULED);
        delivery.setAttemptCount(1);
        delivery.setNextRetryAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        emailDeliveryRepository.save(delivery);

        // Run retry - MockEmailService succeeds
        int retried = reminderSchedulerService.retryFailedEmails();
        assertEquals(1, retried);

        NotificationEmailDeliveryEntity updated = emailDeliveryRepository.findById(delivery.getId()).orElseThrow();
        assertEquals(EmailDeliveryStatus.SENT, updated.getStatus());

        // Now test delivery exceeding max retries
        NotificationEmailDeliveryEntity maxedDelivery = new NotificationEmailDeliveryEntity(
                null,
                "student2@uom.lk",
                "Subject 2",
                "Body 2"
        );
        maxedDelivery.setStatus(EmailDeliveryStatus.RETRY_SCHEDULED);
        maxedDelivery.setAttemptCount(3);
        maxedDelivery.setNextRetryAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        emailDeliveryRepository.save(maxedDelivery);

        reminderSchedulerService.retryFailedEmails();

        NotificationEmailDeliveryEntity afterMax = emailDeliveryRepository.findById(maxedDelivery.getId()).orElseThrow();
        assertEquals(EmailDeliveryStatus.FAILED, afterMax.getStatus());
    }
}
