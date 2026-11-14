package com.campusfind.features.lostreport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.lostreport.dto.CancelLostReportRequest;
import com.campusfind.features.lostreport.dto.CreateLostReportRequest;
import com.campusfind.features.lostreport.dto.ResolveLostReportRequest;
import com.campusfind.features.lostreport.dto.UpdateLostReportRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportAuditLogEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportImageRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LostReportStudentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportImageRepository lostReportImageRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

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

    private UserEntity studentAlice;
    private UserEntity studentBob;
    private String aliceToken;
    private String bobToken;

    private CategoryEntity testCategory;
    private LocationEntity testLocation;
    private SecurityOfficeEntity testOffice;

    @BeforeEach
    void setUp() {
        tearDown();

        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Password123!"), "Alice Student", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        studentAlice.setPhoneNumber("+94771234567");
        userRepository.save(studentAlice);
        aliceToken = jwtTokenService.generateToken(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Password123!"), "Bob Student", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        studentBob.setPhoneNumber("+94779876543");
        userRepository.save(studentBob);
        bobToken = jwtTokenService.generateToken(studentBob);

        testCategory = new CategoryEntity("Electronics", "Laptops, phones, chargers", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Central Library", "Main library building", "Academic", true);
        locationRepository.save(testLocation);

        testOffice = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "sec@uom.lk", "+94112650000", "24/7");
        securityOfficeRepository.save(testOffice);
    }

    @AfterEach
    void tearDown() {
        lostReportAuditLogRepository.deleteAll();
        lostReportImageRepository.deleteAll();
        lostReportRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
        securityOfficeRepository.deleteAll();
    }

    @Test
    @DisplayName("Student should successfully submit a Lost Report with ACTIVE initial status")
    void testCreateLostReport_Success() throws Exception {
        CreateLostReportRequest request = new CreateLostReportRequest(
                "Black Dell Laptop Charger",
                "65W USB-C charger left at study desk",
                "Scratch near the plug, white tape on wire",
                testCategory.getId(),
                testLocation.getId(),
                "Study cubicle #12",
                Instant.now().minus(2, ChronoUnit.HOURS),
                testOffice.getId()
        );

        String responseBody = mockMvc.perform(post("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Black Dell Laptop Charger"))
                .andExpect(jsonPath("$.description").value("65W USB-C charger left at study desk"))
                .andExpect(jsonPath("$.distinctiveFeatures").value("Scratch near the plug, white tape on wire"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.category.name").value("Electronics"))
                .andExpect(jsonPath("$.location.name").value("Central Library"))
                .andExpect(jsonPath("$.designatedSecurityOffice.name").value("Central Security Desk"))
                .andExpect(jsonPath("$.studentContact.email").value("alice@uom.lk"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        LostReportEntity saved = lostReportRepository.findAll().get(0);
        assertThat(saved.getStatus()).isEqualTo(LostReportStatus.ACTIVE);
        assertThat(saved.getStudent().getId()).isEqualTo(studentAlice.getId());

        List<LostReportAuditLogEntity> logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(saved.getId());
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAction()).isEqualTo("REPORT_CREATED");
        assertThat(logs.get(0).getNewStatus()).isEqualTo("ACTIVE");
    }

    @Test
    @DisplayName("Should reject report creation when validation fails (future date, missing required fields)")
    void testCreateLostReport_ValidationErrors() throws Exception {
        // Future date
        CreateLostReportRequest futureDateRequest = new CreateLostReportRequest(
                "Valid Title",
                "Valid description of item",
                null,
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now().plus(1, ChronoUnit.DAYS),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(futureDateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors").isArray());

        // Blank title
        CreateLostReportRequest blankTitleRequest = new CreateLostReportRequest(
                "",
                "Valid description",
                null,
                testCategory.getId(),
                testLocation.getId(),
                null,
                Instant.now().minus(1, ChronoUnit.HOURS),
                testOffice.getId()
        );

        mockMvc.perform(post("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankTitleRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors").isArray());
    }

    @Test
    @DisplayName("Student should retrieve only their own lost reports and not other students'")
    void testGetMyLostReports_PrivacyIsolation() throws Exception {
        // Alice creates report
        LostReportEntity aliceReport = new LostReportEntity(
                "Alice's Blue Umbrella", "Foldable umbrella", null,
                testCategory, testLocation, "Entrance rack",
                Instant.now().minus(1, ChronoUnit.HOURS), studentAlice, testOffice
        );
        lostReportRepository.save(aliceReport);

        // Bob creates report
        LostReportEntity bobReport = new LostReportEntity(
                "Bob's Silver Watch", "Casio vintage watch", null,
                testCategory, testLocation, "Washroom counter",
                Instant.now().minus(1, ChronoUnit.HOURS), studentBob, testOffice
        );
        lostReportRepository.save(bobReport);

        // Alice views her list
        mockMvc.perform(get("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Alice's Blue Umbrella"));

        // Bob views his list
        mockMvc.perform(get("/api/v1/lost-reports")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Bob's Silver Watch"));
    }

    @Test
    @DisplayName("Accessing another student's report by ID must return 404 to prevent enumeration / IDOR")
    void testGetMyLostReportById_CrossStudent_Returns404() throws Exception {
        LostReportEntity bobReport = new LostReportEntity(
                "Bob's Private Notebook", "Contains lecture notes and personal thoughts", null,
                testCategory, testLocation, "Table 5",
                Instant.now().minus(2, ChronoUnit.HOURS), studentBob, testOffice
        );
        lostReportRepository.save(bobReport);

        // Alice attempts to access Bob's report
        mockMvc.perform(get("/api/v1/lost-reports/" + bobReport.getId())
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNotFound());

        // Bob can access his own report
        mockMvc.perform(get("/api/v1/lost-reports/" + bobReport.getId())
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Bob's Private Notebook"));
    }

    @Test
    @DisplayName("Owner should successfully update permitted details of an ACTIVE report")
    void testUpdateLostReport_Success() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Calculator", "Casio calculator", null,
                testCategory, testLocation, "Desk 1",
                Instant.now().minus(3, ChronoUnit.HOURS), studentAlice, testOffice
        );
        lostReportRepository.save(report);

        UpdateLostReportRequest updateRequest = new UpdateLostReportRequest(
                "Casio fx-991EX Calculator",
                "White and black scientific calculator in leather pouch",
                "Name sticker 'Alice' inside battery cover",
                testCategory.getId(),
                testLocation.getId(),
                "Desk 1, Reading Room A",
                null
        );

        mockMvc.perform(put("/api/v1/lost-reports/" + report.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Casio fx-991EX Calculator"))
                .andExpect(jsonPath("$.description").value("White and black scientific calculator in leather pouch"))
                .andExpect(jsonPath("$.distinctiveFeatures").value("Name sticker 'Alice' inside battery cover"));

        List<LostReportAuditLogEntity> logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(report.getId());
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAction()).isEqualTo("REPORT_UPDATED");
    }

    @Test
    @DisplayName("Attempting to update another student's report must return 404")
    void testUpdateLostReport_CrossStudent_Returns404() throws Exception {
        LostReportEntity bobReport = new LostReportEntity(
                "Bob's Item", "Bob's description", null,
                testCategory, testLocation, null,
                Instant.now().minus(1, ChronoUnit.HOURS), studentBob, testOffice
        );
        lostReportRepository.save(bobReport);

        UpdateLostReportRequest updateRequest = new UpdateLostReportRequest(
                "Hacked Title", null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/lost-reports/" + bobReport.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Updating a CANCELLED or RESOLVED report must be rejected with 409 Conflict")
    void testUpdateLostReport_WhenNotActive_Returns409() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Pencil Case", "Blue pencil case", null,
                testCategory, testLocation, null,
                Instant.now().minus(1, ChronoUnit.HOURS), studentAlice, testOffice
        );
        report.setStatus(LostReportStatus.CANCELLED);
        lostReportRepository.save(report);

        UpdateLostReportRequest updateRequest = new UpdateLostReportRequest(
                "New Title", null, null, null, null, null, null
        );

        mockMvc.perform(put("/api/v1/lost-reports/" + report.getId())
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Student should successfully cancel their ACTIVE lost report")
    void testCancelLostReport_Success() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Lost Water Bottle", "Hydro flask red", null,
                testCategory, testLocation, "Gym bench",
                Instant.now().minus(2, ChronoUnit.HOURS), studentAlice, testOffice
        );
        lostReportRepository.save(report);

        CancelLostReportRequest request = new CancelLostReportRequest("Found it in my locker");

        mockMvc.perform(post("/api/v1/lost-reports/" + report.getId() + "/cancel")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellationReason").value("Found it in my locker"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());

        LostReportEntity updated = lostReportRepository.findById(report.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(LostReportStatus.CANCELLED);

        List<LostReportAuditLogEntity> logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(report.getId());
        assertThat(logs).hasSize(1);
        assertThat(logs.get(0).getAction()).isEqualTo("REPORT_CANCELLED");
        assertThat(logs.get(0).getNewStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("Student should successfully mark their ACTIVE lost report as RESOLVED")
    void testResolveLostReport_Success() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Lost Glasses", "Black frame spectacles", null,
                testCategory, testLocation, "Classroom 301",
                Instant.now().minus(4, ChronoUnit.HOURS), studentAlice, testOffice
        );
        lostReportRepository.save(report);

        ResolveLostReportRequest request = new ResolveLostReportRequest("Recovered from security desk");

        mockMvc.perform(post("/api/v1/lost-reports/" + report.getId() + "/resolve")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNotes").value("Recovered from security desk"))
                .andExpect(jsonPath("$.resolvedAt").isNotEmpty())
                .andExpect(jsonPath("$.resolvedByUserId").value(studentAlice.getId().toString()));

        LostReportEntity updated = lostReportRepository.findById(report.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(LostReportStatus.RESOLVED);
    }

    @Test
    @DisplayName("Resolving an already RESOLVED or CANCELLED report must return 409 Conflict")
    void testResolveLostReport_InvalidState_Returns409() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Lost Glasses", "Black frame spectacles", null,
                testCategory, testLocation, "Classroom 301",
                Instant.now().minus(4, ChronoUnit.HOURS), studentAlice, testOffice
        );
        report.setStatus(LostReportStatus.RESOLVED);
        lostReportRepository.save(report);

        mockMvc.perform(post("/api/v1/lost-reports/" + report.getId() + "/resolve")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Should successfully upload and delete image on ACTIVE report")
    void testImageUploadAndDelete_Success() throws Exception {
        LostReportEntity report = new LostReportEntity(
                "Lost Watch", "Leather strap watch", null,
                testCategory, testLocation, "Lab 2",
                Instant.now().minus(1, ChronoUnit.HOURS), studentAlice, testOffice
        );
        lostReportRepository.save(report);

        MockMultipartFile imageFile = new MockMultipartFile(
                "file",
                "watch_photo.png",
                "image/png",
                "fake-png-image-content".getBytes()
        );

        String uploadResponse = mockMvc.perform(multipart("/api/v1/lost-reports/" + report.getId() + "/images")
                        .file(imageFile)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.originalFilename").value("watch_photo.png"))
                .andExpect(jsonPath("$.contentType").value("image/png"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        UUID imageId = UUID.fromString(objectMapper.readTree(uploadResponse).get("id").asText());

        // Delete image
        mockMvc.perform(delete("/api/v1/lost-reports/" + report.getId() + "/images/" + imageId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());

        assertThat(lostReportImageRepository.findById(imageId)).isEmpty();
    }

    @Test
    @DisplayName("Cross-student image upload must be forbidden")
    void testImageUpload_CrossStudent_ReturnsForbidden() throws Exception {
        LostReportEntity bobReport = new LostReportEntity(
                "Bob's Bag", "Blue backpack", null,
                testCategory, testLocation, null,
                Instant.now().minus(1, ChronoUnit.HOURS), studentBob, testOffice
        );
        lostReportRepository.save(bobReport);

        MockMultipartFile imageFile = new MockMultipartFile(
                "file", "photo.png", "image/png", "content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/lost-reports/" + bobReport.getId() + "/images")
                        .file(imageFile)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Students must be forbidden from accessing officer endpoints")
    void testStudentCannotAccessOfficerEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated requests to lost report endpoints must return 401 Unauthorized")
    void testUnauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/lost-reports"))
                .andExpect(status().isUnauthorized());
    }
}
