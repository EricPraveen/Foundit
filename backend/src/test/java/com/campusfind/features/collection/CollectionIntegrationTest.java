package com.campusfind.features.collection;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class CollectionIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private ClaimEvidenceRepository claimEvidenceRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

    @Autowired
    private ReputationTransactionRepository reputationTransactionRepository;

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

    private UserEntity studentAlice;
    private UserEntity studentBob;
    private UserEntity officerOfficeA;
    private UserEntity officerOfficeB;
    private UserEntity superAdmin;

    private String studentAliceToken;
    private String officerOfficeAToken;
    private String officerOfficeBToken;
    private String adminToken;

    private SecurityOfficeEntity officeA;
    private SecurityOfficeEntity officeB;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;

    private FoundItemEntity reservedItemA;
    private ClaimEntity approvedClaimA;

    @BeforeEach
    void setUp() {
        tearDown();

        officeA = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "secA@uom.lk", "+94112650001", "24/7");
        officeRepository.save(officeA);

        officeB = new SecurityOfficeEntity("Hostel Security Post", "Hostel Gate", "secB@uom.lk", "+94112650002", "06:00-22:00");
        officeRepository.save(officeB);

        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Pass1234!"), "Alice Smith", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        userRepository.save(studentAlice);
        studentAliceToken = jwtTokenService.generateToken(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Pass1234!"), "Bob Jones", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        userRepository.save(studentBob);

        officerOfficeA = new UserEntity("officerA@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer A", UserRole.SECURITY_OFFICER);
        officerOfficeA.setEmailVerified(true);
        userRepository.save(officerOfficeA);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeA.getId(), officeA, "SEC-001"));
        officerOfficeAToken = jwtTokenService.generateToken(officerOfficeA);

        officerOfficeB = new UserEntity("officerB@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer B", UserRole.SECURITY_OFFICER);
        officerOfficeB.setEmailVerified(true);
        userRepository.save(officerOfficeB);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeB.getId(), officeB, "SEC-002"));
        officerOfficeBToken = jwtTokenService.generateToken(officerOfficeB);

        superAdmin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1234!"), "Super Admin", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        userRepository.save(superAdmin);
        adminToken = jwtTokenService.generateToken(superAdmin);

        testCategory = new CategoryEntity("Electronics", "Laptops & Gadgets", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Library", "Central Library", "Academic", true);
        locationRepository.save(testLocation);

        // Create reserved found item in Office A (CLAIM_PENDING)
        reservedItemA = new FoundItemEntity("ThinkPad X1 Laptop", "Black ThinkPad laptop", testCategory, testLocation,
                "Table 5", Instant.now().minus(2, ChronoUnit.DAYS), studentBob, officeA);
        reservedItemA.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(reservedItemA);

        // Create approved claim by student Alice
        approvedClaimA = new ClaimEntity(reservedItemA, studentAlice, "210001A", "ThinkPad with sticker on lid");
        approvedClaimA.setStatus(ClaimStatus.APPROVED);
        approvedClaimA.setReviewingOfficer(officerOfficeA);
        approvedClaimA.setReviewedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        claimRepository.save(approvedClaimA);
    }

    @AfterEach
    void tearDown() {
        itemCollectionLogRepository.deleteAll();
        reputationTransactionRepository.deleteAll();
        lostReportAuditLogRepository.deleteAll();
        lostReportRepository.deleteAll();
        claimEvidenceRepository.deleteAll();
        claimRepository.deleteAll();
        foundItemRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
    }

    @Test
    @DisplayName("Authorized Security Officer should confirm physical collection: claim COMPLETED, item RETURNED, log recorded")
    void testConfirmCollection_Success() throws Exception {
        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Verified physical Student ID at counter", null);

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.claimId").value(approvedClaimA.getId().toString()))
                .andExpect(jsonPath("$.foundItemId").value(reservedItemA.getId().toString()))
                .andExpect(jsonPath("$.claimantEmail").value("alice@uom.lk"))
                .andExpect(jsonPath("$.claimStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.itemAvailabilityStatus").value("RETURNED"))
                .andExpect(jsonPath("$.confirmingOfficerName").value("Officer A"))
                .andExpect(jsonPath("$.officerNotes").value("Verified physical Student ID at counter"));

        // Verify DB state
        ClaimEntity updatedClaim = claimRepository.findById(approvedClaimA.getId()).orElseThrow();
        assertEquals(ClaimStatus.COMPLETED, updatedClaim.getStatus());

        FoundItemEntity updatedItem = foundItemRepository.findById(reservedItemA.getId()).orElseThrow();
        assertEquals(ItemAvailabilityStatus.RETURNED, updatedItem.getAvailabilityStatus());

        assertTrue(itemCollectionLogRepository.existsByClaimId(approvedClaimA.getId()));
        assertTrue(itemCollectionLogRepository.existsByFoundItemId(reservedItemA.getId()));
    }

    @Test
    @DisplayName("Confirm collection with valid linked Lost Report transitions report to RECOVERED and logs audit")
    void testConfirmCollection_WithLinkedLostReport_TransitionsToRecovered() throws Exception {
        // Create an ACTIVE lost report owned by Alice
        LostReportEntity aliceReport = new LostReportEntity(
                "Lost ThinkPad X1", "Black ThinkPad X1 Carbon lost near Library",
                "Has a Red Hat sticker", testCategory, testLocation, "Table 5",
                Instant.now().minus(3, ChronoUnit.DAYS), studentAlice, officeA
        );
        aliceReport.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(aliceReport);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Collection verified", aliceReport.getId());

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.linkedLostReportId").value(aliceReport.getId().toString()))
                .andExpect(jsonPath("$.lostReportStatus").value("RECOVERED"));

        // Verify Lost Report status in database
        LostReportEntity updatedReport = lostReportRepository.findById(aliceReport.getId()).orElseThrow();
        assertEquals(LostReportStatus.RECOVERED, updatedReport.getStatus());
        assertNotNull(updatedReport.getResolvedAt());
        assertEquals(officerOfficeA.getId(), updatedReport.getResolvedBy().getId());

        // Verify audit log
        var logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(aliceReport.getId());
        assertEquals(1, logs.size());
        assertEquals("RECOVERED_VIA_COLLECTION", logs.get(0).getAction());
        assertEquals("ACTIVE", logs.get(0).getPreviousStatus());
        assertEquals("RECOVERED", logs.get(0).getNewStatus());
    }

    @Test
    @DisplayName("Students cannot confirm physical collection (403 Forbidden)")
    void testConfirmCollection_ForbiddenForStudent() throws Exception {
        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + studentAliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer from different security office cannot confirm collection (403 Forbidden)")
    void testConfirmCollection_ForbiddenForWrongOfficeOfficer() throws Exception {
        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Confirm collection fails when claim is not APPROVED (400 Bad Request)")
    void testConfirmCollection_FailsWhenClaimNotApproved() throws Exception {
        // Change claim to PENDING
        approvedClaimA.setStatus(ClaimStatus.PENDING);
        claimRepository.save(approvedClaimA);

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Confirm collection fails when claim is already COMPLETED (409 Conflict)")
    void testConfirmCollection_FailsWhenClaimAlreadyCompleted() throws Exception {
        // Confirm once
        ConfirmCollectionRequest request = new ConfirmCollectionRequest("First collection", null);
        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Repeated request must return 409 Conflict
        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Confirm collection fails when item availability is not CLAIM_PENDING (409 Conflict)")
    void testConfirmCollection_FailsWhenItemNotClaimPending() throws Exception {
        reservedItemA.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(reservedItemA);

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Confirm collection fails when linked lost report belongs to a different student (400 Bad Request)")
    void testConfirmCollection_FailsWhenLostReportBelongsToOtherStudent() throws Exception {
        // Lost report owned by Bob, while claimant is Alice
        LostReportEntity bobReport = new LostReportEntity(
                "Bob's Lost Item", "Some item", "None", testCategory, testLocation, "Hall",
                Instant.now().minus(1, ChronoUnit.DAYS), studentBob, officeA
        );
        bobReport.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(bobReport);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Notes", bobReport.getId());

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Confirm collection fails when linked lost report is not ACTIVE (409 Conflict)")
    void testConfirmCollection_FailsWhenLostReportNotActive() throws Exception {
        LostReportEntity cancelledReport = new LostReportEntity(
                "Alice's Cancelled Item", "Some item", "None", testCategory, testLocation, "Hall",
                Instant.now().minus(1, ChronoUnit.DAYS), studentAlice, officeA
        );
        cancelledReport.setStatus(LostReportStatus.CANCELLED);
        lostReportRepository.save(cancelledReport);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Notes", cancelledReport.getId());

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Super Admin can confirm collection across any Security Office")
    void testConfirmCollection_SuperAdmin_CanConfirmAcrossOffices() throws Exception {
        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Admin collection override", null);

        mockMvc.perform(post("/api/v1/officer/claims/" + approvedClaimA.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.confirmingOfficerName").value("Super Admin"))
                .andExpect(jsonPath("$.claimStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.itemAvailabilityStatus").value("RETURNED"));
    }
}
