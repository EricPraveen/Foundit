package com.campusfind.features.workflow;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.common.event.ClaimApprovedEvent;
import com.campusfind.common.event.CollectionConfirmedEvent;
import com.campusfind.common.event.FoundItemReportedEvent;
import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.collection.dto.ConfirmCollectionRequest;
import com.campusfind.features.lostreport.LostReportService;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
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
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.nio.file.Files;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ArchitectureRefactoringIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficeRepository securityOfficeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private LostReportRepository lostReportRepository;

    @Autowired
    private LostReportAuditLogRepository lostReportAuditLogRepository;

    @Autowired
    private ItemCollectionLogRepository itemCollectionLogRepository;

    @Autowired
    private LostReportService lostReportService;

    private UserEntity officerUser;
    private UserEntity studentUser;
    private UserEntity otherStudentUser;
    private SecurityOfficeEntity testOffice;
    private CategoryEntity testCategory;
    private LocationEntity testLocation;
    private String officerToken;

    @BeforeEach
    void setUp() {
        tearDown();

        testOffice = securityOfficeRepository.save(
                new SecurityOfficeEntity("Main Security Desk", "Security HQ", "sec@uom.lk", "+94112650301", "08:00 - 18:00")
        );

        officerUser = new UserEntity("officer.arch@uom.lk", passwordEncoder.encode("Password123!"), "Officer Arch", UserRole.SECURITY_OFFICER);
        officerUser.setEmailVerified(true);
        officerUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(officerUser);

        SecurityOfficerProfileEntity profile = new SecurityOfficerProfileEntity(officerUser.getId(), testOffice, "SO-ARCH-01");
        officerProfileRepository.save(profile);

        studentUser = new UserEntity("claimant.arch@uom.lk", passwordEncoder.encode("Password123!"), "Claimant Arch", UserRole.STUDENT);
        studentUser.setEmailVerified(true);
        studentUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(studentUser);

        otherStudentUser = new UserEntity("impostor.arch@uom.lk", passwordEncoder.encode("Password123!"), "Impostor Arch", UserRole.STUDENT);
        otherStudentUser.setEmailVerified(true);
        otherStudentUser.setStatus(UserStatus.ACTIVE);
        userRepository.save(otherStudentUser);

        testCategory = categoryRepository.save(new CategoryEntity("Electronics", "Gadgets and laptops", true));
        testLocation = locationRepository.save(new LocationEntity("Library", "Main Library", "Academic", true));

        officerToken = jwtTokenService.generateToken(officerUser);
    }

    @AfterEach
    void tearDown() {
        itemCollectionLogRepository.deleteAll();
        lostReportAuditLogRepository.deleteAll();
        lostReportRepository.deleteAll();
        claimRepository.deleteAll();
        foundItemRepository.deleteAll();
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        locationRepository.deleteAll();
        securityOfficeRepository.deleteAll();
    }

    @Test
    @DisplayName("ISS-02: Verify that no Java class in src/main imports features.notification.event")
    void testNoImportsFromLegacyNotificationEventPackage() throws Exception {
        File srcDir = new File("src/main/java");
        assertTrue(srcDir.exists(), "src/main/java must exist");

        Files.walk(srcDir.toPath())
                .filter(p -> p.toString().endsWith(".java"))
                .forEach(p -> {
                    try {
                        List<String> lines = Files.readAllLines(p);
                        for (int i = 0; i < lines.size(); i++) {
                            String line = lines.get(i);
                            assertFalse(line.contains("com.campusfind.features.notification.event"),
                                    "File " + p.getFileName() + " contains legacy import: " + line);
                        }
                    } catch (Exception e) {
                        throw new RuntimeException(e);
                    }
                });

        // Verify shared events are in com.campusfind.common.event
        assertEquals("com.campusfind.common.event", FoundItemReportedEvent.class.getPackageName());
        assertEquals("com.campusfind.common.event", ClaimApprovedEvent.class.getPackageName());
        assertEquals("com.campusfind.common.event", CollectionConfirmedEvent.class.getPackageName());
    }

    @Test
    @DisplayName("ISS-03: LostReportService.resolveFromCollection updates status, timestamps, and audits")
    void testLostReportService_ResolveFromCollection_Success() {
        LostReportEntity report = new LostReportEntity(
                "Lost Laptop", "Black ThinkPad X1", "Distinctive skin",
                testCategory, testLocation, "Floor 2",
                Instant.now().minus(2, ChronoUnit.DAYS), studentUser, testOffice
        );
        report.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(report);

        UUID claimId = UUID.randomUUID();
        LostReportEntity resolved = lostReportService.resolveFromCollection(report.getId(), studentUser, officerUser, claimId);

        assertNotNull(resolved);
        assertEquals(LostReportStatus.RECOVERED, resolved.getStatus());
        assertNotNull(resolved.getResolvedAt());
        assertEquals(officerUser.getId(), resolved.getResolvedBy().getId());

        // Verify audit log recorded
        var auditLogs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(report.getId());
        assertEquals(1, auditLogs.size());
        assertEquals("RECOVERED_VIA_COLLECTION", auditLogs.get(0).getAction());
        assertEquals("ACTIVE", auditLogs.get(0).getPreviousStatus());
        assertEquals("RECOVERED", auditLogs.get(0).getNewStatus());
    }

    @Test
    @DisplayName("ISS-03: LostReportService.resolveFromCollection rejects wrong claimant or student caller")
    void testLostReportService_ResolveFromCollection_SecurityValidations() {
        LostReportEntity report = new LostReportEntity(
                "Lost Laptop", "ThinkPad", "No sticker",
                testCategory, testLocation, "Floor 1",
                Instant.now().minus(1, ChronoUnit.DAYS), studentUser, testOffice
        );
        report.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(report);

        UUID claimId = UUID.randomUUID();

        // 1. Student caller cannot execute resolveFromCollection (403 Forbidden)
        ResponseStatusException exRole = assertThrows(ResponseStatusException.class, () ->
                lostReportService.resolveFromCollection(report.getId(), studentUser, studentUser, claimId)
        );
        assertEquals(HttpStatus.FORBIDDEN, exRole.getStatusCode());

        // 2. Mismatched claimant rejected (400 Bad Request)
        ResponseStatusException exOwner = assertThrows(ResponseStatusException.class, () ->
                lostReportService.resolveFromCollection(report.getId(), otherStudentUser, officerUser, claimId)
        );
        assertEquals(HttpStatus.BAD_REQUEST, exOwner.getStatusCode());
    }

    @Test
    @DisplayName("ISS-03: End-to-End Collection endpoint resolves linked Lost Report via LostReportService delegation")
    void testEndToEndCollection_ResolvesLinkedLostReport() throws Exception {
        FoundItemEntity item = new FoundItemEntity(
                "Found ThinkPad", "Found in library lobby", testCategory,
                testLocation, "Near entrance", Instant.now().minus(2, ChronoUnit.DAYS),
                otherStudentUser, testOffice
        );
        item.setAvailabilityStatus(ItemAvailabilityStatus.CLAIM_PENDING);
        foundItemRepository.save(item);

        ClaimEntity claim = new ClaimEntity(item, studentUser, "210002B", "My ThinkPad with serial 12345");
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setReviewingOfficer(officerUser);
        claimRepository.save(claim);

        LostReportEntity report = new LostReportEntity(
                "Lost Laptop", "ThinkPad", "Serial 12345",
                testCategory, testLocation, "Lobby",
                Instant.now().minus(3, ChronoUnit.DAYS), studentUser, testOffice
        );
        report.setStatus(LostReportStatus.ACTIVE);
        lostReportRepository.save(report);

        ConfirmCollectionRequest request = new ConfirmCollectionRequest("Handed over at counter", report.getId());

        mockMvc.perform(post("/api/v1/officer/claims/" + claim.getId() + "/confirm-collection")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.claimStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.itemAvailabilityStatus").value("RETURNED"))
                .andExpect(jsonPath("$.linkedLostReportId").value(report.getId().toString()))
                .andExpect(jsonPath("$.lostReportStatus").value("RECOVERED"));

        LostReportEntity updatedReport = lostReportRepository.findById(report.getId()).orElseThrow();
        assertEquals(LostReportStatus.RECOVERED, updatedReport.getStatus());
        assertEquals(officerUser.getId(), updatedReport.getResolvedBy().getId());

        var logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(report.getId());
        assertEquals(1, logs.size());
        assertEquals("RECOVERED_VIA_COLLECTION", logs.get(0).getAction());
    }
}
