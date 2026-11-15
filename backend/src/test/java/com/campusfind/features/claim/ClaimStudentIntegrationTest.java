package com.campusfind.features.claim;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.claim.EvidenceType;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEvidenceEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimEvidenceRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ClaimStudentIntegrationTest {

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
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private SecurityOfficeRepository securityOfficeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private StorageService storageService;

    @Value("${app.storage.bucket:test-bucket}")
    private String storageBucket;

    private UserEntity finder;
    private UserEntity studentAlice;
    private UserEntity studentBob;
    private String aliceToken;
    private String bobToken;

    private CategoryEntity testCategory;
    private LocationEntity testLocation;
    private SecurityOfficeEntity testOffice;
    private FoundItemEntity availableItem;

    @BeforeEach
    void setUp() {
        tearDown();

        finder = new UserEntity("finder@uom.lk", passwordEncoder.encode("Pass1234!"), "Finder Felix", UserRole.STUDENT);
        finder.setEmailVerified(true);
        userRepository.save(finder);

        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Pass1234!"), "Alice Student", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        studentAlice.setPhoneNumber("+94771234567");
        userRepository.save(studentAlice);
        aliceToken = jwtTokenService.generateToken(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Pass1234!"), "Bob Student", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        studentBob.setPhoneNumber("+94779876543");
        userRepository.save(studentBob);
        bobToken = jwtTokenService.generateToken(studentBob);

        testCategory = new CategoryEntity("Electronics", "Phones, laptops, electronics", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Library", "Main Library Building", "Academic", true);
        locationRepository.save(testLocation);

        testOffice = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "sec@uom.lk", "+94112650000", "24/7");
        securityOfficeRepository.save(testOffice);

        // Create an AVAILABLE found item
        availableItem = new FoundItemEntity(
                "iPhone 13 Midnight Black",
                "Found on reading table #5 with black case",
                testCategory,
                testLocation,
                "Reading Table 5",
                Instant.now().minus(2, ChronoUnit.HOURS),
                finder,
                testOffice
        );
        availableItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        availableItem.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(availableItem);
    }

    @AfterEach
    void tearDown() {
        claimEvidenceRepository.deleteAll();
        claimRepository.deleteAll();
        foundItemRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
        securityOfficeRepository.deleteAll();
    }

    @Test
    @DisplayName("Student should successfully submit a claim with Student ID and ownership proof")
    void testSubmitClaim_Success() throws Exception {
        MockMultipartFile studentIdCard = new MockMultipartFile(
                "studentIdCard", "student_id.png", "image/png", "fake-student-id-image-bytes".getBytes()
        );
        MockMultipartFile ownershipProof = new MockMultipartFile(
                "ownershipProof", "receipt.pdf", "application/pdf", "fake-purchase-receipt-bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/found-items/" + availableItem.getId() + "/claims")
                        .file(studentIdCard)
                        .file(ownershipProof)
                        .param("indexNumber", "210001A")
                        .param("ownershipDescription", "This is my iPhone 13. Lockscreen shows my dog and passcode is 123456.")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.foundItemId").value(availableItem.getId().toString()))
                .andExpect(jsonPath("$.claimant.email").value("alice@uom.lk"))
                .andExpect(jsonPath("$.claimant.indexNumber").value("210001A"))
                .andExpect(jsonPath("$.evidence.length()").value(2));

        assertThat(claimRepository.findAll()).hasSize(1);
        ClaimEntity claim = claimRepository.findAll().get(0);
        assertThat(claim.getStatus()).isEqualTo(ClaimStatus.PENDING);
        assertThat(claim.getIndexNumber()).isEqualTo("210001A");

        assertThat(claimEvidenceRepository.findByClaimId(claim.getId())).hasSize(2);
    }

    @Test
    @DisplayName("Should reject claim submission for unavailable item (PENDING_HANDOVER)")
    void testSubmitClaim_UnavailableItem_Rejected() throws Exception {
        FoundItemEntity pendingItem = new FoundItemEntity(
                "Pending Item", "Not yet confirmed by officer",
                testCategory, testLocation, null, Instant.now().minus(1, ChronoUnit.HOURS), finder, testOffice
        );
        foundItemRepository.save(pendingItem);

        MockMultipartFile studentIdCard = new MockMultipartFile(
                "studentIdCard", "id.png", "image/png", "bytes".getBytes()
        );
        MockMultipartFile ownershipProof = new MockMultipartFile(
                "ownershipProof", "receipt.png", "image/png", "bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/found-items/" + pendingItem.getId() + "/claims")
                        .file(studentIdCard)
                        .file(ownershipProof)
                        .param("indexNumber", "210001A")
                        .param("ownershipDescription", "This is my lost item that is pending handover")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Item is not currently available for claims"));
    }

    @Test
    @DisplayName("Finder cannot claim the item they reported finding")
    void testSubmitClaim_FinderCannotClaimOwnFoundItem() throws Exception {
        String finderToken = jwtTokenService.generateToken(finder);

        MockMultipartFile studentIdCard = new MockMultipartFile("studentIdCard", "id.png", "image/png", "bytes".getBytes());
        MockMultipartFile ownershipProof = new MockMultipartFile("ownershipProof", "proof.png", "image/png", "bytes".getBytes());

        mockMvc.perform(multipart("/api/v1/found-items/" + availableItem.getId() + "/claims")
                        .file(studentIdCard)
                        .file(ownershipProof)
                        .param("indexNumber", "210999X")
                        .param("ownershipDescription", "Trying to claim item I found")
                        .header("Authorization", "Bearer " + finderToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Cannot submit a claim for an item you reported finding"));
    }

    @Test
    @DisplayName("Student cannot submit duplicate active claim for the same item")
    void testSubmitClaim_DuplicateActiveClaim_Rejected() throws Exception {
        MockMultipartFile idCard = new MockMultipartFile("studentIdCard", "id.png", "image/png", "bytes".getBytes());
        MockMultipartFile proof = new MockMultipartFile("ownershipProof", "proof.png", "image/png", "bytes".getBytes());

        // First claim
        mockMvc.perform(multipart("/api/v1/found-items/" + availableItem.getId() + "/claims")
                        .file(idCard)
                        .file(proof)
                        .param("indexNumber", "210001A")
                        .param("ownershipDescription", "First valid ownership claim")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated());

        // Second claim attempt by same student
        mockMvc.perform(multipart("/api/v1/found-items/" + availableItem.getId() + "/claims")
                        .file(idCard)
                        .file(proof)
                        .param("indexNumber", "210001A")
                        .param("ownershipDescription", "Second attempt to claim same item")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Student retrieves only their own submitted claims")
    void testGetMyClaims_PrivacyIsolation() throws Exception {
        ClaimEntity aliceClaim = new ClaimEntity(availableItem, studentAlice, "210001A", "Alice description");
        claimRepository.save(aliceClaim);

        ClaimEntity bobClaim = new ClaimEntity(availableItem, studentBob, "210002B", "Bob description");
        claimRepository.save(bobClaim);

        // Alice views claims
        mockMvc.perform(get("/api/v1/claims/me")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value(aliceClaim.getId().toString()));

        // Bob views claims
        mockMvc.perform(get("/api/v1/claims/me")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value(bobClaim.getId().toString()));
    }

    @Test
    @DisplayName("Accessing another student's claim by ID must return 404 Not Found")
    void testGetClaimById_CrossStudent_Returns404() throws Exception {
        ClaimEntity bobClaim = new ClaimEntity(availableItem, studentBob, "210002B", "Bob description");
        claimRepository.save(bobClaim);

        // Alice attempts to access Bob's claim
        mockMvc.perform(get("/api/v1/claims/" + bobClaim.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Student can successfully cancel their own PENDING claim")
    void testCancelClaim_Success() throws Exception {
        ClaimEntity claim = new ClaimEntity(availableItem, studentAlice, "210001A", "Alice description");
        claimRepository.save(claim);

        mockMvc.perform(post("/api/v1/claims/" + claim.getId() + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());

        ClaimEntity updated = claimRepository.findById(claim.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ClaimStatus.CANCELLED);
    }

    @Test
    @DisplayName("Student can download private evidence for their own claim, but cannot download another's")
    void testDownloadEvidence_SecurityEnforced() throws Exception {
        ClaimEntity claim = new ClaimEntity(availableItem, studentAlice, "210001A", "Alice description");
        claimRepository.save(claim);

        byte[] fileBytes = "secret-alice-student-id-photo-content".getBytes();
        String storagePath = "claims/" + claim.getId() + "/id_card.png";
        storageService.upload(storageBucket, storagePath, fileBytes, "image/png");

        ClaimEvidenceEntity evidence = new ClaimEvidenceEntity(
                claim, EvidenceType.STUDENT_ID_CARD, "id_card.png", storagePath, "image/png", fileBytes.length
        );
        claimEvidenceRepository.save(evidence);

        // Alice downloads her own evidence -> 200 OK
        mockMvc.perform(get("/api/v1/claims/" + claim.getId() + "/evidence/" + evidence.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(fileBytes));

        // Bob attempts to download Alice's private evidence -> 404 Not Found (or forbidden)
        mockMvc.perform(get("/api/v1/claims/" + claim.getId() + "/evidence/" + evidence.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isNotFound());
    }
}
