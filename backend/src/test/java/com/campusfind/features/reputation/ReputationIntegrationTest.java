package com.campusfind.features.reputation;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.CategoryReputationRuleRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemHandoverLogRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.ItemCollectionLogRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.ReputationTransactionRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReputationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReputationTransactionRepository reputationTransactionRepository;

    @Autowired
    private CategoryReputationRuleRepository categoryReputationRuleRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private FoundItemHandoverLogRepository handoverLogRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

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

    private UserEntity studentFinder;
    private UserEntity studentClaimant;
    private UserEntity officer;

    private String studentFinderToken;
    private String studentClaimantToken;
    private String officerToken;

    private SecurityOfficeEntity office;
    private CategoryEntity electronicsCategory;
    private LocationEntity location;

    @BeforeEach
    void setUp() {
        tearDown();

        office = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "sec@uom.lk", "+94112650001", "24/7");
        officeRepository.save(office);

        studentFinder = new UserEntity("finder@uom.lk", passwordEncoder.encode("Pass1234!"), "Finder Sam", UserRole.STUDENT);
        studentFinder.setEmailVerified(true);
        userRepository.save(studentFinder);
        studentFinderToken = jwtTokenService.generateToken(studentFinder);

        studentClaimant = new UserEntity("claimant@uom.lk", passwordEncoder.encode("Pass1234!"), "Claimant Clara", UserRole.STUDENT);
        studentClaimant.setEmailVerified(true);
        userRepository.save(studentClaimant);
        studentClaimantToken = jwtTokenService.generateToken(studentClaimant);

        officer = new UserEntity("officer@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Dan", UserRole.SECURITY_OFFICER);
        officer.setEmailVerified(true);
        userRepository.save(officer);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officer.getId(), office, "SEC-001"));
        officerToken = jwtTokenService.generateToken(officer);

        electronicsCategory = new CategoryEntity("Electronics", "Phones and laptops", true);
        categoryRepository.save(electronicsCategory);

        location = new LocationEntity("Library", "Main Library", "Academic Zone", true);
        locationRepository.save(location);

        // Ensure category rules exist for test category
        categoryReputationRuleRepository.save(new CategoryReputationRuleEntity(
                electronicsCategory, ReputationTransactionType.FOUND_ITEM_HANDOVER, 15, true));
        categoryReputationRuleRepository.save(new CategoryReputationRuleEntity(
                electronicsCategory, ReputationTransactionType.ITEM_COLLECTION, 5, true));
    }

    @AfterEach
    void tearDown() {
        itemCollectionLogRepository.deleteAll();
        reputationTransactionRepository.deleteAll();
        categoryReputationRuleRepository.deleteAll();
        lostReportAuditLogRepository.deleteAll();
        lostReportRepository.deleteAll();
        claimEvidenceRepository.deleteAll();
        claimRepository.deleteAll();
        handoverLogRepository.deleteAll();
        foundItemRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
    }

    @Test
    @DisplayName("Handover confirmation should award category-configured points to finder via ledger")
    void testHandoverConfirmation_AwardsCategoryPoints() throws Exception {
        FoundItemEntity item = new FoundItemEntity(
                "Sony Headphones", "Noise cancelling", electronicsCategory, location,
                "Study Room", Instant.now(), studentFinder, office
        );
        foundItemRepository.save(item);

        ConfirmHandoverRequest request = new ConfirmHandoverRequest("Physical receipt verified");

        mockMvc.perform(post("/api/v1/officer/found-items/" + item.getId() + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handoverStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"));

        // Verify reputation transaction ledger
        int balance = reputationTransactionRepository.sumPointsByUserId(studentFinder.getId());
        assertEquals(15, balance);

        var transactions = reputationTransactionRepository.findByUserIdOrderByCreatedAtDesc(studentFinder.getId(), null);
        assertEquals(1, transactions.getContent().size());
        assertEquals(ReputationTransactionType.FOUND_ITEM_HANDOVER, transactions.getContent().get(0).getTransactionType());
        assertEquals(15, transactions.getContent().get(0).getPoints());
        assertEquals("FOUND_ITEM_HANDOVER:" + item.getId(), transactions.getContent().get(0).getIdempotencyKey());
    }

    @Test
    @DisplayName("Collection confirmation awards configured points to claimant")
    void testCollectionConfirmation_AwardsCollectionPoints() throws Exception {
        FoundItemEntity item = new FoundItemEntity(
                "USB Drive", "64GB SanDisk", electronicsCategory, location,
                "Lab 1", Instant.now(), studentFinder, office
        );
        item.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(item);

        ClaimEntity claim = new ClaimEntity(item, studentClaimant, "210005C", "My SanDisk 64GB drive");
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewingOfficer(officer);
        claimRepository.save(claim);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Collected at counter", null);

        mockMvc.perform(post("/api/v1/officer/claims/" + claim.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pointsAwarded").value(5))
                .andExpect(jsonPath("$.claimStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.itemAvailabilityStatus").value("RETURNED"));

        int balance = reputationTransactionRepository.sumPointsByUserId(studentClaimant.getId());
        assertEquals(5, balance);
    }

    @Test
    @DisplayName("Student can view their own reputation balance via GET /api/v1/users/me/reputation")
    void testGetMyReputationBalance() throws Exception {
        // Award points by creating a transaction
        mockMvc.perform(get("/api/v1/users/me/reputation")
                        .header("Authorization", "Bearer " + studentFinderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(studentFinder.getId().toString()))
                .andExpect(jsonPath("$.currentBalance").value(0))
                .andExpect(jsonPath("$.totalEarned").value(0))
                .andExpect(jsonPath("$.totalTransactions").value(0));
    }

    @Test
    @DisplayName("Student can view their own paginated transaction history via GET /api/v1/users/me/reputation/transactions")
    void testGetMyReputationTransactions() throws Exception {
        // Perform a handover to generate a transaction
        FoundItemEntity item = new FoundItemEntity(
                "Scientific Calculator", "Casio fx-991EX", electronicsCategory, location,
                "Desk 3", Instant.now(), studentFinder, office
        );
        foundItemRepository.save(item);

        ConfirmHandoverRequest handoverReq = new ConfirmHandoverRequest("Received");
        mockMvc.perform(post("/api/v1/officer/found-items/" + item.getId() + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(handoverReq)))
                .andExpect(status().isOk());

        // Now student queries transactions
        mockMvc.perform(get("/api/v1/users/me/reputation/transactions")
                        .header("Authorization", "Bearer " + studentFinderToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].transactionType").value("FOUND_ITEM_HANDOVER"))
                .andExpect(jsonPath("$.content[0].points").value(15))
                .andExpect(jsonPath("$.content[0].description").isNotEmpty());

        // Other student (Clara) sees 0 transactions (anti-IDOR)
        mockMvc.perform(get("/api/v1/users/me/reputation/transactions")
                        .header("Authorization", "Bearer " + studentClaimantToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    @DisplayName("Unauthenticated requests to reputation endpoints return 401 Unauthorized")
    void testUnauthenticated_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/reputation"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/me/reputation/transactions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Transactional rollback: failed collection request rolls back status changes and awards no points")
    void testTransactionalRollback_FailedCollection() throws Exception {
        FoundItemEntity item = new FoundItemEntity(
                "iPad Pro", "Apple tablet", electronicsCategory, location,
                "Room 2", Instant.now(), studentFinder, office
        );
        item.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(item);

        ClaimEntity claim = new ClaimEntity(item, studentClaimant, "210005C", "My iPad Pro");
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewingOfficer(officer);
        claimRepository.save(claim);

        // Lost report owned by DIFFERENT user (studentFinder), which will trigger validation failure
        LostReportEntity otherStudentReport = new LostReportEntity(
                "Lost Tablet", "Lost tablet", "None", electronicsCategory, location, "Room 2",
                Instant.now(), studentFinder, office
        );
        otherStudentReport.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(otherStudentReport);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Failed collection", otherStudentReport.getId());

        mockMvc.perform(post("/api/v1/officer/claims/" + claim.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        // Verify complete transactional rollback
        ClaimEntity claimAfter = claimRepository.findById(claim.getId()).orElseThrow();
        assertEquals(ClaimStatus.APPROVED, claimAfter.getStatus());

        FoundItemEntity itemAfter = foundItemRepository.findById(item.getId()).orElseThrow();
        assertEquals(ItemAvailabilityStatus.CLAIM_PENDING, itemAfter.getAvailabilityStatus());

        assertEquals(0, itemCollectionLogRepository.count());
        assertEquals(0, reputationTransactionRepository.count());
    }
}
