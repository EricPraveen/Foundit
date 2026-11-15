package com.campusfind.features.claim;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.claim.EvidenceType;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.features.claim.dto.ApproveClaimRequest;
import com.campusfind.features.claim.dto.RejectClaimRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEvidenceEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.campusfind.infrastructure.storage.StorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ClaimOfficerIntegrationTest {

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
    private StorageService storageService;

    @Value("${app.storage.bucket:test-bucket}")
    private String storageBucket;

    private UserEntity studentAlice;
    private UserEntity studentBob;
    private UserEntity officerOfficeA;
    private UserEntity officerOfficeB;
    private UserEntity superAdmin;

    private String officerOfficeAToken;
    private String officerOfficeBToken;
    private String adminToken;

    private SecurityOfficeEntity officeA;
    private SecurityOfficeEntity officeB;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;

    private FoundItemEntity itemOfficeA;
    private FoundItemEntity itemOfficeB;
    private ClaimEntity claimItemA;
    private ClaimEntity claimItemB;

    @BeforeEach
    void setUp() {
        tearDown();

        officeA = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "secA@uom.lk", "+94112650001", "24/7");
        officeRepository.save(officeA);

        officeB = new SecurityOfficeEntity("Hostel Security Post", "Hostel Gate", "secB@uom.lk", "+94112650002", "06:00-22:00");
        officeRepository.save(officeB);

        testCategory = new CategoryEntity("Electronics", "Laptops and devices", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Main Complex", "Academic Zone", "Academic", true);
        locationRepository.save(testLocation);

        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Pass1234!"), "Alice Student", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        studentAlice.setPhoneNumber("+94771112222");
        userRepository.save(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Pass1234!"), "Bob Student", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        studentBob.setPhoneNumber("+94773334444");
        userRepository.save(studentBob);

        officerOfficeA = new UserEntity("officerA@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Arthur", UserRole.SECURITY_OFFICER);
        officerOfficeA.setEmailVerified(true);
        userRepository.save(officerOfficeA);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeA.getId(), officeA, "SEC-A-01"));
        officerOfficeAToken = jwtTokenService.generateToken(officerOfficeA);

        officerOfficeB = new UserEntity("officerB@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Brian", UserRole.SECURITY_OFFICER);
        officerOfficeB.setEmailVerified(true);
        userRepository.save(officerOfficeB);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeB.getId(), officeB, "SEC-B-01"));
        officerOfficeBToken = jwtTokenService.generateToken(officerOfficeB);

        superAdmin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1234!"), "Super Administrator", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        userRepository.save(superAdmin);
        adminToken = jwtTokenService.generateToken(superAdmin);

        itemOfficeA = new FoundItemEntity(
                "Calculus Textbook", "Hardcover 9th edition with yellow notes",
                testCategory, testLocation, "Desk 10", Instant.now().minus(3, ChronoUnit.HOURS), studentAlice, officeA
        );
        itemOfficeA.setHandoverStatus(HandoverStatus.CONFIRMED);
        itemOfficeA.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(itemOfficeA);

        itemOfficeB = new FoundItemEntity(
                "Scientific Calculator", "Casio fx-991EX black",
                testCategory, testLocation, "Lab 3", Instant.now().minus(4, ChronoUnit.HOURS), studentBob, officeB
        );
        itemOfficeB.setHandoverStatus(HandoverStatus.CONFIRMED);
        itemOfficeB.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(itemOfficeB);

        claimItemA = new ClaimEntity(itemOfficeA, studentBob, "210002B", "Bob claims Calculus Textbook with receipt");
        claimRepository.save(claimItemA);

        claimItemB = new ClaimEntity(itemOfficeB, studentAlice, "210001A", "Alice claims Calculator with battery cover label");
        claimRepository.save(claimItemB);
    }

    @AfterEach
    void tearDown() {
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
    @DisplayName("Officer search should only list claims within their assigned Security Office scope")
    void testOfficerListClaims_OfficeScopeEnforced() throws Exception {
        // Officer A sees claimItemA (in Office A)
        mockMvc.perform(get("/api/v1/officer/claims")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].foundItemTitle").value("Calculus Textbook"))
                .andExpect(jsonPath("$.content[0].claimant.email").value("bob@uom.lk"));

        // Officer B sees claimItemB (in Office B)
        mockMvc.perform(get("/api/v1/officer/claims")
                        .header("Authorization", "Bearer " + officerOfficeBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].foundItemTitle").value("Scientific Calculator"))
                .andExpect(jsonPath("$.content[0].claimant.email").value("alice@uom.lk"));
    }

    @Test
    @DisplayName("Super Admin should be able to view claims across all security offices")
    void testSuperAdmin_CanAccessAcrossOffices() throws Exception {
        mockMvc.perform(get("/api/v1/officer/claims")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @DisplayName("Officer reviewing claim outside assigned office scope receives 403 Forbidden")
    void testOfficerGetClaimById_CrossOffice_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/officer/claims/" + claimItemB.getId())
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer should successfully approve a valid claim and reserve found item (CLAIM_PENDING)")
    void testOfficerApproveClaim_Success() throws Exception {
        ApproveClaimRequest request = new ApproveClaimRequest("Receipt and Student ID verified. Ownership confirmed.");

        mockMvc.perform(post("/api/v1/officer/claims/" + claimItemA.getId() + "/approve")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewNotes").value("Receipt and Student ID verified. Ownership confirmed."))
                .andExpect(jsonPath("$.reviewingOfficerName").value("Officer Arthur"))
                .andExpect(jsonPath("$.reviewedAt").isNotEmpty());

        ClaimEntity updatedClaim = claimRepository.findById(claimItemA.getId()).orElseThrow();
        assertThat(updatedClaim.getStatus()).isEqualTo(ClaimStatus.APPROVED);

        FoundItemEntity updatedItem = foundItemRepository.findById(itemOfficeA.getId()).orElseThrow();
        assertThat(updatedItem.getAvailabilityStatus()).isEqualTo(ItemAvailabilityStatus.CLAIM_PENDING);
    }

    @Test
    @DisplayName("Officer should successfully reject a claim with mandatory rejection reason")
    void testOfficerRejectClaim_Success() throws Exception {
        RejectClaimRequest request = new RejectClaimRequest("Provided receipt does not match item serial number.");

        mockMvc.perform(post("/api/v1/officer/claims/" + claimItemA.getId() + "/reject")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Provided receipt does not match item serial number."));

        ClaimEntity updatedClaim = claimRepository.findById(claimItemA.getId()).orElseThrow();
        assertThat(updatedClaim.getStatus()).isEqualTo(ClaimStatus.REJECTED);

        // Found Item remains AVAILABLE for other claimants
        FoundItemEntity item = foundItemRepository.findById(itemOfficeA.getId()).orElseThrow();
        assertThat(item.getAvailabilityStatus()).isEqualTo(ItemAvailabilityStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Multiple pending claims can coexist for the same item; approving one preserves the other")
    void testMultiplePendingClaims_CoexistAndApprovalBehavior() throws Exception {
        UserEntity studentCharlie = new UserEntity("charlie@uom.lk", passwordEncoder.encode("Pass1234!"), "Charlie", UserRole.STUDENT);
        studentCharlie.setEmailVerified(true);
        userRepository.save(studentCharlie);

        // Charlie submits second claim for itemOfficeA
        ClaimEntity claim2 = new ClaimEntity(itemOfficeA, studentCharlie, "210003C", "Charlie also claims the calculus textbook");
        claimRepository.save(claim2);

        // Both claims coexist in PENDING state
        assertThat(claimRepository.findByFoundItemIdAndStatus(itemOfficeA.getId(), ClaimStatus.PENDING)).hasSize(2);

        // Officer approves Bob's claim
        ApproveClaimRequest request = new ApproveClaimRequest("Bob had the original receipt");
        mockMvc.perform(post("/api/v1/officer/claims/" + claimItemA.getId() + "/approve")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Charlie's claim remains PENDING in database (not deleted or discarded)
        ClaimEntity charlieClaim = claimRepository.findById(claim2.getId()).orElseThrow();
        assertThat(charlieClaim.getStatus()).isEqualTo(ClaimStatus.PENDING);

        // Attempting to approve Charlie's claim while Bob's is APPROVED must be rejected with 409 Conflict
        mockMvc.perform(post("/api/v1/officer/claims/" + claim2.getId() + "/approve")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ApproveClaimRequest("Second approval"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Another claim has already been approved for this item"));
    }

    @Test
    @DisplayName("Rejected claimant is permitted to submit a new claim with new evidence")
    void testRejectedClaimant_CanResubmit() throws Exception {
        // Reject original claim
        claimItemA.setStatus(ClaimStatus.REJECTED);
        claimItemA.setRejectionReason("Insufficient photo proof");
        claimRepository.save(claimItemA);

        // Bob submits a second claim
        ClaimEntity secondClaim = new ClaimEntity(itemOfficeA, studentBob, "210002B", "Bob submits new proof: store warranty document");
        claimRepository.save(secondClaim);

        assertThat(claimRepository.findByFoundItemId(itemOfficeA.getId())).hasSize(2);
        assertThat(secondClaim.getStatus()).isEqualTo(ClaimStatus.PENDING);
    }

    @Test
    @DisplayName("Officer can download private claim evidence for review within office scope")
    void testOfficerDownloadEvidence_Success() throws Exception {
        byte[] fileBytes = "evidence-file-bytes-for-officer-review".getBytes();
        String storagePath = "claims/" + claimItemA.getId() + "/proof.pdf";
        storageService.upload(storageBucket, storagePath, fileBytes, "application/pdf");

        ClaimEvidenceEntity evidence = new ClaimEvidenceEntity(
                claimItemA, EvidenceType.OWNERSHIP_PROOF, "proof.pdf", storagePath, "application/pdf", fileBytes.length
        );
        claimEvidenceRepository.save(evidence);

        mockMvc.perform(get("/api/v1/officer/claims/" + claimItemA.getId() + "/evidence/" + evidence.getId())
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(fileBytes));
    }
}
