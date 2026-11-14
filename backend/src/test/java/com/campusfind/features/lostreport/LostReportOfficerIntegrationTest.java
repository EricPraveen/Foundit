package com.campusfind.features.lostreport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.lostreport.dto.CancelLostReportRequest;
import com.campusfind.features.lostreport.dto.ResolveLostReportRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportAuditLogEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportImageRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class LostReportOfficerIntegrationTest {

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

    private String officerOfficeAToken;
    private String officerOfficeBToken;
    private String adminToken;

    private SecurityOfficeEntity officeA;
    private SecurityOfficeEntity officeB;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;

    private LostReportEntity reportOfficeA;
    private LostReportEntity reportOfficeB;

    @BeforeEach
    void setUp() {
        tearDown();

        // Security Offices
        officeA = new SecurityOfficeEntity("Central Security Desk", "Admin Complex", "secA@uom.lk", "+94112650001", "24/7");
        officeRepository.save(officeA);

        officeB = new SecurityOfficeEntity("Hostel Security Post", "Hostel Gate", "secB@uom.lk", "+94112650002", "06:00-22:00");
        officeRepository.save(officeB);

        // Category & Location
        testCategory = new CategoryEntity("Electronics", "Laptops and devices", true);
        categoryRepository.save(testCategory);

        testLocation = new LocationEntity("Main Hall", "Convocation building", "Academic", true);
        locationRepository.save(testLocation);

        // Students
        studentAlice = new UserEntity("alice@uom.lk", passwordEncoder.encode("Pass1234!"), "Alice Student", UserRole.STUDENT);
        studentAlice.setEmailVerified(true);
        studentAlice.setPhoneNumber("+94771112222");
        userRepository.save(studentAlice);

        studentBob = new UserEntity("bob@uom.lk", passwordEncoder.encode("Pass1234!"), "Bob Student", UserRole.STUDENT);
        studentBob.setEmailVerified(true);
        studentBob.setPhoneNumber("+94773334444");
        userRepository.save(studentBob);

        // Officer A assigned to Office A
        officerOfficeA = new UserEntity("officerA@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Arthur", UserRole.SECURITY_OFFICER);
        officerOfficeA.setEmailVerified(true);
        userRepository.save(officerOfficeA);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeA.getId(), officeA, "SEC-A-01"));
        officerOfficeAToken = jwtTokenService.generateToken(officerOfficeA);

        // Officer B assigned to Office B
        officerOfficeB = new UserEntity("officerB@uom.lk", passwordEncoder.encode("Pass1234!"), "Officer Brian", UserRole.SECURITY_OFFICER);
        officerOfficeB.setEmailVerified(true);
        userRepository.save(officerOfficeB);
        officerProfileRepository.save(new SecurityOfficerProfileEntity(officerOfficeB.getId(), officeB, "SEC-B-01"));
        officerOfficeBToken = jwtTokenService.generateToken(officerOfficeB);

        // Super Admin
        superAdmin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass1234!"), "Super Administrator", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        userRepository.save(superAdmin);
        adminToken = jwtTokenService.generateToken(superAdmin);

        // Create Lost Report in Office A
        reportOfficeA = new LostReportEntity(
                "MacBook Pro 14", "Silver laptop with stickers", "Serial #C02G... on bottom",
                testCategory, testLocation, "Table 3",
                Instant.now().minus(2, ChronoUnit.HOURS), studentAlice, officeA
        );
        lostReportRepository.save(reportOfficeA);
        lostReportAuditLogRepository.save(new LostReportAuditLogEntity(
                reportOfficeA, studentAlice.getId(), "STUDENT", "REPORT_CREATED", null, "ACTIVE", "Created"
        ));

        // Create Lost Report in Office B
        reportOfficeB = new LostReportEntity(
                "Sony Headphones", "Black WH-1000XM4 in hard case", "Slight tear on left earcup",
                testCategory, testLocation, "Gym locker",
                Instant.now().minus(3, ChronoUnit.HOURS), studentBob, officeB
        );
        lostReportRepository.save(reportOfficeB);
        lostReportAuditLogRepository.save(new LostReportAuditLogEntity(
                reportOfficeB, studentBob.getId(), "STUDENT", "REPORT_CREATED", null, "ACTIVE", "Created"
        ));
    }

    @AfterEach
    void tearDown() {
        lostReportAuditLogRepository.deleteAll();
        lostReportImageRepository.deleteAll();
        lostReportRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
    }

    @Test
    @DisplayName("Officer should only see lost reports within their assigned Security Office scope")
    void testOfficerSearchLostReports_EnforcesOfficeScope() throws Exception {
        // Officer A searches: must see only reportOfficeA
        mockMvc.perform(get("/api/v1/officer/lost-reports")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("MacBook Pro 14"))
                .andExpect(jsonPath("$.content[0].studentContact.fullName").value("Alice Student"))
                .andExpect(jsonPath("$.content[0].studentContact.email").value("alice@uom.lk"));

        // Officer B searches: must see only reportOfficeB
        mockMvc.perform(get("/api/v1/officer/lost-reports")
                        .header("Authorization", "Bearer " + officerOfficeBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].title").value("Sony Headphones"))
                .andExpect(jsonPath("$.content[0].studentContact.fullName").value("Bob Student"))
                .andExpect(jsonPath("$.content[0].studentContact.email").value("bob@uom.lk"));
    }

    @Test
    @DisplayName("Super Admin should be able to view lost reports across all offices")
    void testSuperAdmin_CanAccessAcrossOffices() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    @DisplayName("Officer retrieving report in their office scope should receive operational student contact info")
    void testOfficerGetLostReportById_WithinScope_Success() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports/" + reportOfficeA.getId())
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("MacBook Pro 14"))
                .andExpect(jsonPath("$.distinctiveFeatures").value("Serial #C02G... on bottom"))
                .andExpect(jsonPath("$.studentContact.email").value("alice@uom.lk"))
                .andExpect(jsonPath("$.studentContact.phoneNumber").value("+94771112222"));
    }

    @Test
    @DisplayName("Officer retrieving report belonging to a different Security Office must receive 403 Forbidden")
    void testOfficerGetLostReportById_DifferentOfficeScope_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports/" + reportOfficeB.getId())
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer should successfully mark an active lost report as RESOLVED in their office")
    void testOfficerResolveLostReport_Success() throws Exception {
        ResolveLostReportRequest request = new ResolveLostReportRequest("Student collected item from security post");

        mockMvc.perform(post("/api/v1/officer/lost-reports/" + reportOfficeA.getId() + "/resolve")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.resolutionNotes").value("Student collected item from security post"))
                .andExpect(jsonPath("$.resolvedByUserId").value(officerOfficeA.getId().toString()));

        List<LostReportAuditLogEntity> logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(reportOfficeA.getId());
        assertThat(logs).hasSize(2);
        assertThat(logs.get(0).getAction()).isEqualTo("REPORT_RESOLVED");
        assertThat(logs.get(0).getActorRole()).isEqualTo("SECURITY_OFFICER");
    }

    @Test
    @DisplayName("Officer resolving report belonging to a different Security Office must receive 403 Forbidden")
    void testOfficerResolveLostReport_DifferentOffice_Returns403() throws Exception {
        ResolveLostReportRequest request = new ResolveLostReportRequest("Unauthorized resolution attempt");

        mockMvc.perform(post("/api/v1/officer/lost-reports/" + reportOfficeB.getId() + "/resolve")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer should successfully cancel an active lost report in their office")
    void testOfficerCancelLostReport_Success() throws Exception {
        CancelLostReportRequest request = new CancelLostReportRequest("Duplicate report identified");

        mockMvc.perform(post("/api/v1/officer/lost-reports/" + reportOfficeA.getId() + "/cancel")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancellationReason").value("Duplicate report identified"));
    }

    @Test
    @DisplayName("Officer cancelling report belonging to a different Security Office must receive 403 Forbidden")
    void testOfficerCancelLostReport_DifferentOffice_Returns403() throws Exception {
        CancelLostReportRequest request = new CancelLostReportRequest("Unauthorized cancellation attempt");

        mockMvc.perform(post("/api/v1/officer/lost-reports/" + reportOfficeB.getId() + "/cancel")
                        .header("Authorization", "Bearer " + officerOfficeAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Officer should retrieve complete audit trail for a report in their office")
    void testOfficerGetAuditHistory_Success() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports/" + reportOfficeA.getId() + "/audit-history")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("REPORT_CREATED"))
                .andExpect(jsonPath("$[0].actorRole").value("STUDENT"));
    }

    @Test
    @DisplayName("Officer retrieving audit trail for report in another office must receive 403 Forbidden")
    void testOfficerGetAuditHistory_DifferentOffice_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/officer/lost-reports/" + reportOfficeB.getId() + "/audit-history")
                        .header("Authorization", "Bearer " + officerOfficeAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Public found items browse API must NEVER return or expose lost reports")
    void testPublicFoundItems_NeverExposesLostReports() throws Exception {
        mockMvc.perform(get("/api/v1/found-items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }
}
