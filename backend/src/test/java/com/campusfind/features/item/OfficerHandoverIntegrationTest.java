package com.campusfind.features.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemHandoverLogRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.ReputationTransactionRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class OfficerHandoverIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private FoundItemHandoverLogRepository handoverLogRepository;

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
    private ReputationTransactionRepository reputationTransactionRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity student;
    private UserEntity officerOfficeA;
    private UserEntity officerOfficeB;
    private UserEntity superAdmin;

    private String studentToken;
    private String officerOfficeAToken;
    private String officerOfficeBToken;
    private String adminToken;

    private SecurityOfficeEntity officeA;
    private SecurityOfficeEntity officeB;
    private CategoryEntity category;
    private LocationEntity location;

    @BeforeEach
    void setUp() {
        reputationTransactionRepository.deleteAll();
        handoverLogRepository.deleteAll();
        foundItemRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();

        // Offices
        officeA = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "secA@uom.lk", "+94112650001", "24/7");
        officeRepository.save(officeA);

        officeB = new SecurityOfficeEntity("Hostel Security Post", "Hostel Gate", "secB@uom.lk", "+94112650002", "06:00-22:00");
        officeRepository.save(officeB);

        // Student
        student = new UserEntity("student@uom.lk", passwordEncoder.encode("Pass1234!"), "Student Jane", UserRole.STUDENT);
        student.setEmailVerified(true);
        userRepository.save(student);
        studentToken = jwtTokenService.generateToken(student);

        // Officer A (assigned to officeA)
        officerOfficeA = new UserEntity("officerA@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Smith", UserRole.SECURITY_OFFICER);
        officerOfficeA.setEmailVerified(true);
        userRepository.save(officerOfficeA);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeA.getId(), officeA, "SEC-001"));
        officerOfficeAToken = jwtTokenService.generateToken(officerOfficeA);

        // Officer B (assigned to officeB)
        officerOfficeB = new UserEntity("officerB@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Jones", UserRole.SECURITY_OFFICER);
        officerOfficeB.setEmailVerified(true);
        userRepository.save(officerOfficeB);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeB.getId(), officeB, "SEC-002"));
        officerOfficeBToken = jwtTokenService.generateToken(officerOfficeB);

        // Admin
        superAdmin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1234!"), "Super Admin", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        userRepository.save(superAdmin);
        adminToken = jwtTokenService.generateToken(superAdmin);

        // Category & Location
        category = new CategoryEntity("Electronics", "Laptops & Devices", true);
        categoryRepository.save(category);

        location = new LocationEntity("Library", "Main Library", "Academic", true);
        locationRepository.save(location);
    }

    @AfterEach
    void tearDown() {
        reputationTransactionRepository.deleteAll();
        handoverLogRepository.deleteAll();
        foundItemRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
    }

    private String reportItemForOffice(SecurityOfficeEntity office) throws Exception {
        CreateFoundItemRequest request = new CreateFoundItemRequest(
                "Dell XPS Laptop",
                "Silver Dell laptop found in study cubicle 7",
                category.getId(),
                location.getId(),
                "Cubicle 7",
                Instant.now().minus(3, ChronoUnit.HOURS),
                office.getId()
        );

        String res = mockMvc.perform(post("/api/v1/found-items")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(res).get("id").asText();
    }

    @Test
    @DisplayName("Authorized Officer can confirm physical receipt, transitioning item to AVAILABLE")
    void testConfirmHandover_Success() throws Exception {
        String itemId = reportItemForOffice(officeA);

        ConfirmHandoverRequest confirmReq = new ConfirmHandoverRequest("Inspected by Officer Smith. Laptop has university asset sticker.");

        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(confirmReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(itemId))
                .andExpect(jsonPath("$.handoverStatus").value("CONFIRMED"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.receivedByOfficerId").value(officerOfficeA.getId().toString()))
                .andExpect(jsonPath("$.receivingOfficerName").value("Officer Smith"))
                .andExpect(jsonPath("$.handoverConfirmedAt").exists())
                .andExpect(jsonPath("$.officerNotes").value("Inspected by Officer Smith. Laptop has university asset sticker."));

        // Verify database state
        FoundItemEntity item = foundItemRepository.findById(java.util.UUID.fromString(itemId)).orElseThrow();
        assertThat(item.getHandoverStatus()).isEqualTo(com.campusfind.domain.item.HandoverStatus.CONFIRMED);
        assertThat(item.getAvailabilityStatus()).isEqualTo(com.campusfind.domain.item.ItemAvailabilityStatus.AVAILABLE);
        assertThat(item.getReceivingOfficer().getId()).isEqualTo(officerOfficeA.getId());

        // Verify audit log
        assertThat(handoverLogRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Item becomes publicly discoverable only after officer handover confirmation")
    void testConfirmedItem_DiscoveredInPublicBrowse() throws Exception {
        String itemId = reportItemForOffice(officeA);

        // Before confirmation: public browse is empty
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        // Confirm handover
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("Received"))))
                .andExpect(status().isOk());

        // After confirmation: public browse shows the item with finder info masked
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(itemId))
                .andExpect(jsonPath("$.content[0].title").value("Dell XPS Laptop"))
                .andExpect(jsonPath("$.content[0].availabilityStatus").value("AVAILABLE"));
    }

    @Test
    @DisplayName("Students cannot confirm handovers (Forbidden 403)")
    void testStudentCannotConfirmHandover() throws Exception {
        String itemId = reportItemForOffice(officeA);

        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("Self-confirm"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer cannot confirm item designated for another security office (Forbidden 403)")
    void testOfficerFromDifferentOffice_Forbidden() throws Exception {
        // Item is designated for Office A
        String itemId = reportItemForOffice(officeA);

        // Officer B (assigned to Office B) tries to confirm it
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("Invalid office handover"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Officer is not assigned to the designated security office for this item"));
    }

    @Test
    @DisplayName("Duplicate handover confirmation is rejected with 409 Conflict")
    void testDuplicateHandoverConfirmation_Conflict() throws Exception {
        String itemId = reportItemForOffice(officeA);

        // First confirmation succeeds
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("First confirmation"))))
                .andExpect(status().isOk());

        // Second confirmation returns 409 Conflict
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("Duplicate confirmation"))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Officer can retrieve pending handover queue and handover audit history")
    void testPendingQueueAndAuditHistory() throws Exception {
        String itemId = reportItemForOffice(officeA);

        // Officer A checks pending handover items
        mockMvc.perform(get("/api/v1/officer/found-items/pending-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].id").value(itemId));

        // Officer A confirms
        mockMvc.perform(post("/api/v1/officer/found-items/" + itemId + "/confirm-handover")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ConfirmHandoverRequest("Audit check notes"))))
                .andExpect(status().isOk());

        // Check audit history
        mockMvc.perform(get("/api/v1/officer/found-items/" + itemId + "/handover-history")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$.[0].foundItemId").value(itemId))
                .andExpect(jsonPath("$.[0].receivingOfficerId").value(officerOfficeA.getId().toString()))
                .andExpect(jsonPath("$.[0].notes").value("Audit check notes"));
    }
}
