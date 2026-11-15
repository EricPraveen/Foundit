package com.campusfind.features.officer;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.ItemCollectionLogEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.ClaimRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.ItemCollectionLogRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OfficerDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private ItemCollectionLogRepository collectionLogRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity student;
    private UserEntity officer;
    private UserEntity superAdmin;
    private SecurityOfficeEntity office;
    private CategoryEntity category;
    private LocationEntity location;

    private String studentToken;
    private String officerToken;
    private String adminToken;

    private FoundItemEntity availableItem;
    private FoundItemEntity pendingHandoverItem;
    private FoundItemEntity returnedItem;
    private ClaimEntity pendingClaim;
    private ClaimEntity approvedClaim;

    @BeforeEach
    void setUp() {
        office = officeRepository.findFirstByActiveTrue()
                .orElseGet(() -> officeRepository.save(new SecurityOfficeEntity("Central Security Office", "Main Gate", "0112650301", "sec@uom.lk", "24/7")));

        student = new UserEntity("student.dash@uom.lk", passwordEncoder.encode("Password123!"), "Student Dash", UserRole.STUDENT);
        student.setEmailVerified(true);
        student.setStatus(UserStatus.ACTIVE);
        userRepository.save(student);

        officer = new UserEntity("officer.dash@uom.lk", passwordEncoder.encode("Password123!"), "Officer Dash", UserRole.SECURITY_OFFICER);
        officer.setEmailVerified(true);
        officer.setStatus(UserStatus.ACTIVE);
        userRepository.save(officer);

        officerProfileRepository.save(new SecurityOfficerProfileEntity(officer.getId(), office, "OFF-DASH-101"));

        superAdmin = new UserEntity("admin.dash@uom.lk", passwordEncoder.encode("Password123!"), "Admin Dash", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        superAdmin.setStatus(UserStatus.ACTIVE);
        userRepository.save(superAdmin);

        studentToken = jwtTokenService.generateToken(student);
        officerToken = jwtTokenService.generateToken(officer);
        adminToken = jwtTokenService.generateToken(superAdmin);

        category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(new CategoryEntity("Electronics", "Electronic gadgets", true)));

        location = locationRepository.findAll().stream().findFirst()
                .orElseGet(() -> locationRepository.save(new LocationEntity("Main Library", "North Zone", "Library building", true)));

        // 1. Pending handover item
        pendingHandoverItem = new FoundItemEntity("Keys found", "Keychain with 3 keys", category, location, "Floor 2", Instant.now(), student, office);
        pendingHandoverItem.setHandoverStatus(HandoverStatus.PENDING);
        pendingHandoverItem.setAvailabilityStatus(ItemAvailabilityStatus.UNAVAILABLE);
        foundItemRepository.save(pendingHandoverItem);

        // 2. Available item
        availableItem = new FoundItemEntity("Laptop found", "Dell XPS 13", category, location, "Desk 5", Instant.now(), student, office);
        availableItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        availableItem.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        foundItemRepository.save(availableItem);

        // 3. Pending claim on available item
        pendingClaim = new ClaimEntity(availableItem, student, "204001A", "It is my black Dell XPS");
        pendingClaim.setStatus(ClaimStatus.PENDING);
        claimRepository.save(pendingClaim);

        // 4. Returned item with confirmed collection
        returnedItem = new FoundItemEntity("Calculator found", "Casio fx-991ES", category, location, "Lab 1", Instant.now().minus(2, ChronoUnit.DAYS), student, office);
        returnedItem.setHandoverStatus(HandoverStatus.CONFIRMED);
        returnedItem.setAvailabilityStatus(ItemAvailabilityStatus.RETURNED);
        foundItemRepository.save(returnedItem);

        approvedClaim = new ClaimEntity(returnedItem, student, "204001A", "My Casio calculator");
        approvedClaim.setStatus(ClaimStatus.COMPLETED);
        claimRepository.save(approvedClaim);

        ItemCollectionLogEntity collectionLog = new ItemCollectionLogEntity(
                approvedClaim, returnedItem, student, officer, office, Instant.now().minus(1, ChronoUnit.DAYS), "Collected with Student ID check"
        );
        collectionLogRepository.save(collectionLog);

        // 5. Active Lost Report
        LostReportEntity lostReport = new LostReportEntity("Lost Backpack", "Blue Swissgear bag", "Red ribbon", category, location, "Canteen", Instant.now(), student, office);
        lostReport.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(lostReport);
    }

    @Test
    @DisplayName("Security Officer receives accurate operational dashboard counts")
    void testOfficerDashboard_ReturnsAccuratePersistedCounts() throws Exception {
        mockMvc.perform(get("/api/v1/officer/dashboard")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableItems", equalTo(1)))
                .andExpect(jsonPath("$.pendingHandovers", equalTo(1)))
                .andExpect(jsonPath("$.pendingClaims", equalTo(1)))
                .andExpect(jsonPath("$.pendingCollection", equalTo(0)))
                .andExpect(jsonPath("$.returnedItems", equalTo(1)))
                .andExpect(jsonPath("$.unclaimedItems", equalTo(0)))
                .andExpect(jsonPath("$.activeLostReports", equalTo(1)))
                .andExpect(jsonPath("$.officeName", equalTo(office.getName())))
                .andExpect(jsonPath("$.officeId", equalTo(office.getId().toString())));
    }

    @Test
    @DisplayName("Super Admin receives global operational dashboard view")
    void testSuperAdminDashboard_ReturnsGlobalCounts() throws Exception {
        mockMvc.perform(get("/api/v1/officer/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availableItems", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.pendingHandovers", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.officeName", equalTo("All Security Offices")));
    }

    @Test
    @DisplayName("Students cannot access officer dashboard (403 Forbidden)")
    void testOfficerDashboard_ForbiddenForStudents() throws Exception {
        mockMvc.perform(get("/api/v1/officer/dashboard")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request to dashboard returns 401 Unauthorized")
    void testOfficerDashboard_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/officer/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Officer can list found items within office scope with filters")
    void testOfficerListFoundItems_WithFilters() throws Exception {
        mockMvc.perform(get("/api/v1/officer/found-items")
                        .header("Authorization", "Bearer " + officerToken)
                        .param("availabilityStatus", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", equalTo(1)))
                .andExpect(jsonPath("$.content[0].id", equalTo(availableItem.getId().toString())));
    }

    @Test
    @DisplayName("Officer can retrieve collection confirmation for found item and claim")
    void testOfficerGetCollectionDetails() throws Exception {
        // By Found Item ID
        mockMvc.perform(get("/api/v1/officer/found-items/" + returnedItem.getId() + "/collection")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foundItemId", equalTo(returnedItem.getId().toString())))
                .andExpect(jsonPath("$.claimId", equalTo(approvedClaim.getId().toString())))
                .andExpect(jsonPath("$.claimantEmail", equalTo(student.getEmail())));

        // By Claim ID
        mockMvc.perform(get("/api/v1/officer/claims/" + approvedClaim.getId() + "/collection")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.foundItemId", equalTo(returnedItem.getId().toString())))
                .andExpect(jsonPath("$.claimId", equalTo(approvedClaim.getId().toString())));
    }

    @Test
    @DisplayName("Students cannot access officer found items list (403 Forbidden)")
    void testStudentCannotAccessOfficerInventory() throws Exception {
        mockMvc.perform(get("/api/v1/officer/found-items")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }
}
