package com.campusfind.features.workflow;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.admin.dto.UpdateUserStatusRequest;
import com.campusfind.features.auth.AuthService;
import com.campusfind.features.auth.dto.LoginRequest;
import com.campusfind.features.auth.dto.RegisterRequest;
import com.campusfind.features.claim.dto.ApproveClaimRequest;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.features.lostreport.dto.CreateLostReportRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.EmailVerificationTokenEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.EmailVerificationTokenRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BackendVerificationGateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private SecurityOfficeEntity centralOffice;
    private CategoryEntity electronicsCategory;
    private LocationEntity libraryLocation;
    private UserEntity officerUser;
    private UserEntity superAdminUser;
    private String officerToken;
    private String superAdminToken;

    @BeforeEach
    void setUp() {
        centralOffice = officeRepository.findFirstByActiveTrue()
                .orElseGet(() -> officeRepository.save(new SecurityOfficeEntity("Central Security Office", "Main Gate", "0112650301", "sec@uom.lk", "24/7")));

        electronicsCategory = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(new CategoryEntity("Electronics", "Gadgets and tech", true)));

        libraryLocation = locationRepository.findAll().stream().findFirst()
                .orElseGet(() -> locationRepository.save(new LocationEntity("Main Library", "North Zone", "Library building", true)));

        officerUser = new UserEntity("central.officer@uom.lk", passwordEncoder.encode("Password123!"), "Central Officer", UserRole.SECURITY_OFFICER);
        officerUser.setEmailVerified(true);
        officerUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(officerUser);

        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerUser.getId(), centralOffice, "OFF-GATE-01"));

        superAdminUser = new UserEntity("gate.admin@uom.lk", passwordEncoder.encode("Password123!"), "Platform Admin", UserRole.SUPER_ADMIN);
        superAdminUser.setEmailVerified(true);
        superAdminUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(superAdminUser);

        officerToken = jwtTokenService.generateToken(officerUser);
        superAdminToken = jwtTokenService.generateToken(superAdminUser);
    }

    @Test
    @DisplayName("Journey A — Student Registration, Verification Gate, Login, and Profile")
    void testJourneyA_StudentRegistrationAndAuth() throws Exception {
        // 1. Invalid domain rejected
        RegisterRequest invalidRequest = new RegisterRequest("hacker@gmail.com", "Password123!", "Fake Student");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        // 2. Valid @uom.lk registration
        String studentEmail = "journey.student@uom.lk";
        RegisterRequest validRequest = new RegisterRequest(studentEmail, "Password123!", "Journey Student");
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated());

        // 3. Unverified login rejected (403 Forbidden)
        LoginRequest loginBeforeVerify = new LoginRequest(studentEmail, "Password123!");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBeforeVerify)))
                .andExpect(status().isForbidden());

        // 4. Verify email directly on the registered user
        UserEntity registeredUser = userRepository.findByEmail(studentEmail).orElseThrow();
        registeredUser.setEmailVerified(true);
        userRepository.save(registeredUser);

        // 5. Verified login succeeds and issues JWT
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginBeforeVerify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email", equalTo(studentEmail)))
                .andReturn();

        JsonNode loginJson = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String studentJwt = loginJson.get("accessToken").asText();

        // 6. Access own profile
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + studentJwt))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", equalTo(studentEmail)));
    }

    @Test
    @DisplayName("Journey B & E — Found Item Lifecycle: Report -> Handover -> Points -> Claim -> Collection -> Return")
    void testJourneyB_and_E_CompleteFoundItemLifecycle() throws Exception {
        // Setup student
        UserEntity studentFinder = new UserEntity("finder@uom.lk", passwordEncoder.encode("Password123!"), "Finder Student", UserRole.STUDENT);
        studentFinder.setEmailVerified(true);
        studentFinder.setStatus(UserStatus.ACTIVE);
        userRepository.save(studentFinder);
        String finderToken = jwtTokenService.generateToken(studentFinder);

        UserEntity studentClaimant = new UserEntity("claimant@uom.lk", passwordEncoder.encode("Password123!"), "Claimant Student", UserRole.STUDENT);
        studentClaimant.setEmailVerified(true);
        studentClaimant.setStatus(UserStatus.ACTIVE);
        userRepository.save(studentClaimant);
        String claimantToken = jwtTokenService.generateToken(studentClaimant);

        // 1. Report found item (initial PENDING_HANDOVER)
        CreateFoundItemRequest reportRequest = new CreateFoundItemRequest(
                "Found Lenovo ThinkPad",
                "Black laptop found near study area",
                electronicsCategory.getId(),
                libraryLocation.getId(),
                "Table 14",
                Instant.now().minus(2, ChronoUnit.HOURS),
                centralOffice.getId()
        );

        MvcResult reportResult = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + finderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reportRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.handoverStatus", equalTo("PENDING")))
                .andExpect(jsonPath("$.availabilityStatus", equalTo("UNAVAILABLE")))
                .andReturn();

        UUID itemId = UUID.fromString(objectMapper.readTree(reportResult.getResponse().getContentAsString()).get("id").asText());

        // 2. Item is not yet visible in public student browse
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == '" + itemId + "')]").doesNotExist());

        // 3. Officer confirms physical handover -> item becomes AVAILABLE and awards finder points
        ConfirmHandoverRequest handoverRequest = new ConfirmHandoverRequest("Handover verified with student ID check");
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(handoverRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.handoverStatus", equalTo("CONFIRMED")))
                .andExpect(jsonPath("$.availabilityStatus", equalTo("AVAILABLE")));

        // 4. Item is now visible in student browse
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.id == '" + itemId + "')]").exists());

        // 5. Claimant submits private claim with Student ID card and proof
        MockMultipartFile idCard = new MockMultipartFile("studentIdCard", "id.png", "image/png", "fake-id-card".getBytes());
        MockMultipartFile proof = new MockMultipartFile("ownershipProof", "proof.png", "image/png", "fake-proof".getBytes());

        MvcResult claimResult = mockMvc.perform(multipart("/api/v1/found-items/" + itemId + "/claims")
                        .file(idCard)
                        .file(proof)
                        .param("indexNumber", "204099B")
                        .param("ownershipDescription", "Lenovo laptop with Ubuntu sticker")
                        .header("Authorization", "Bearer " + claimantToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", equalTo("PENDING")))
                .andReturn();

        UUID claimId = UUID.fromString(objectMapper.readTree(claimResult.getResponse().getContentAsString()).get("id").asText());

        // 6. Officer approves claim -> item transitions to CLAIM_PENDING
        ApproveClaimRequest approveRequest = new ApproveClaimRequest("Serial number verified");
        mockMvc.perform(post("/api/v1/officer/claims/" + claimId + "/approve")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("APPROVED")));

        FoundItemEntity itemAfterApproval = foundItemRepository.findById(itemId).orElseThrow();
        assertEquals(ItemAvailabilityStatus.CLAIM_PENDING, itemAfterApproval.getAvailabilityStatus());

        // 7. Student arrives at office; Officer confirms physical collection
        ConfirmCollectionRequest collectionRequest = new ConfirmCollectionRequest("Collected by student with physical verification", null);
        mockMvc.perform(post("/api/v1/officer/claims/" + claimId + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(collectionRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.claimStatus", equalTo("COMPLETED")))
                .andExpect(jsonPath("$.itemAvailabilityStatus", equalTo("RETURNED")));

        // 8. Re-attempting collection returns 409 Conflict
        mockMvc.perform(post("/api/v1/officer/claims/" + claimId + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(collectionRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Journey C — Private Lost Report Lifecycle, Isolation, and Resolution")
    void testJourneyC_PrivateLostReportLifecycle() throws Exception {
        UserEntity studentOwner = new UserEntity("owner@uom.lk", passwordEncoder.encode("Password123!"), "Owner Student", UserRole.STUDENT);
        studentOwner.setEmailVerified(true);
        studentOwner.setStatus(UserStatus.ACTIVE);
        userRepository.save(studentOwner);
        String ownerToken = jwtTokenService.generateToken(studentOwner);

        UserEntity studentOther = new UserEntity("other@uom.lk", passwordEncoder.encode("Password123!"), "Other Student", UserRole.STUDENT);
        studentOther.setEmailVerified(true);
        studentOther.setStatus(UserStatus.ACTIVE);
        userRepository.save(studentOther);
        String otherToken = jwtTokenService.generateToken(studentOther);

        // 1. Submit private Lost Report
        CreateLostReportRequest request = new CreateLostReportRequest(
                "Lost Wallet",
                "Brown leather wallet with ID",
                "Silver zipper",
                electronicsCategory.getId(),
                libraryLocation.getId(),
                "Near entrance",
                Instant.now().minus(1, ChronoUnit.DAYS),
                centralOffice.getId()
        );

        MvcResult result = mockMvc.perform(post("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + ownerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", equalTo("ACTIVE")))
                .andReturn();

        UUID reportId = UUID.fromString(objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());

        // 2. Owner can view own report
        mockMvc.perform(get("/api/v1/lost-reports/" + reportId)
                        .header("Authorization", "Bearer " + ownerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", equalTo("Lost Wallet")));

        // 3. Other student cannot view report (Anti-IDOR: 404 Not Found)
        mockMvc.perform(get("/api/v1/lost-reports/" + reportId)
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isNotFound());

        // 4. Officer can review and resolve report
        mockMvc.perform(post("/api/v1/officer/lost-reports/" + reportId + "/resolve")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resolutionNotes\":\"Item retrieved by owner\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("RESOLVED")));
    }

    @Test
    @DisplayName("Journey G — Officer Dashboard & Super Admin Audit Governance")
    void testJourneyG_OfficerDashboardAndSuperAdminGovernance() throws Exception {
        // 1. Officer dashboard returns valid operational counts
        mockMvc.perform(get("/api/v1/officer/dashboard")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.officeName", equalTo(centralOffice.getName())));

        // 2. Super Admin can query centralized audit logs
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());

        // 3. Super Admin can inspect system policies
        mockMvc.perform(get("/api/v1/admin/system-config")
                        .header("Authorization", "Bearer " + superAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unclaimedThresholdDays", equalTo(30)));
    }
}
