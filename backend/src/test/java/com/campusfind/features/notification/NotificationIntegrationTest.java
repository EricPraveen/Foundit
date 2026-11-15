package com.campusfind.features.notification;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.notification.NotificationEntityType;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
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
import com.campusfind.infrastructure.security.JwtTokenService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class NotificationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationEmailDeliveryRepository emailDeliveryRepository;

    @Autowired
    private HandoverReminderLogRepository handoverReminderLogRepository;

    @Autowired
    private UnclaimedEscalationLogRepository unclaimedEscalationLogRepository;

    @Autowired
    private ReputationTransactionRepository reputationTransactionRepository;

    @Autowired
    private CategoryReputationRuleRepository categoryReputationRuleRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private FoundItemHandoverLogRepository handoverLogRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private NotificationService notificationService;

    private UserEntity studentAlice;
    private UserEntity studentBob;
    private String aliceToken;
    private String bobToken;

    @BeforeEach
    void setUp() {
        tearDown();

        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Pass1234!"), "Alice Smith", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        userRepository.save(studentAlice);
        aliceToken = jwtTokenService.generateToken(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Pass1234!"), "Bob Jones", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        userRepository.save(studentBob);
        bobToken = jwtTokenService.generateToken(studentBob);
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
    @DisplayName("Student can view their own in-app notifications and unread count")
    void testGetMyNotifications_And_UnreadCount() throws Exception {
        notificationService.createInAppNotification(
                studentAlice, NotificationType.CLAIM_APPROVED, "Claim Approved",
                "Your item is ready for collection", NotificationEntityType.CLAIM, UUID.randomUUID());

        notificationService.createInAppNotification(
                studentAlice, NotificationType.REPUTATION_AWARDED, "Points Awarded",
                "You earned 15 points", NotificationEntityType.REPUTATION, UUID.randomUUID());

        // Alice sees 2 unread notifications
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].title").value("Points Awarded"))
                .andExpect(jsonPath("$.content[1].title").value("Claim Approved"));

        // Bob sees 0 notifications (anti-IDOR)
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    @DisplayName("Marking a notification as read updates read status and timestamps")
    void testMarkAsRead() throws Exception {
        NotificationEntity notif = notificationService.createInAppNotification(
                studentAlice, NotificationType.FOUND_ITEM_REPORTED, "Report Submitted",
                "Please hand over the item", NotificationEntityType.FOUND_ITEM, UUID.randomUUID());

        mockMvc.perform(patch("/api/v1/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true))
                .andExpect(jsonPath("$.readAt").isNotEmpty());

        NotificationEntity updated = notificationRepository.findById(notif.getId()).orElseThrow();
        assertTrue(updated.isRead());
        assertNotNull(updated.getReadAt());
    }

    @Test
    @DisplayName("Marking another user's notification as read returns 404 Not Found (Anti-IDOR)")
    void testMarkAsRead_OtherUser_Forbidden() throws Exception {
        NotificationEntity notif = notificationService.createInAppNotification(
                studentAlice, NotificationType.CLAIM_SUBMITTED, "Claim Received",
                "Review in progress", NotificationEntityType.CLAIM, UUID.randomUUID());

        mockMvc.perform(patch("/api/v1/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Mark all as read marks all unread notifications belonging to the user as read")
    void testMarkAllAsRead() throws Exception {
        notificationService.createInAppNotification(
                studentAlice, NotificationType.CLAIM_APPROVED, "Notif 1", "Message 1", null, null);
        notificationService.createInAppNotification(
                studentAlice, NotificationType.CLAIM_REJECTED, "Notif 2", "Message 2", null, null);

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());

        long unread = notificationRepository.countByRecipientIdAndReadFalse(studentAlice.getId());
        assertEquals(0, unread);
    }

    @Test
    @DisplayName("Unauthenticated access to notification endpoints is rejected with 401 Unauthorized")
    void testUnauthenticated_Rejected() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/notifications/" + UUID.randomUUID() + "/read"))
                .andExpect(status().isUnauthorized());
    }
}
