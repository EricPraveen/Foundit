package com.campusfind.features.audit;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.category.dto.CreateCategoryRequest;
import com.campusfind.infrastructure.persistence.entity.AuditLogEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.AuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class AuditTrailIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private AuditService auditService;

    private UserEntity superAdmin;
    private UserEntity officer;
    private UserEntity student;
    private String adminToken;
    private String officerToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        superAdmin = new UserEntity("admin.audit@uom.lk", passwordEncoder.encode("Password123!"), "Admin Audit", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        superAdmin.setStatus(UserStatus.ACTIVE);
        userRepository.save(superAdmin);

        officer = new UserEntity("officer.audit@uom.lk", passwordEncoder.encode("Password123!"), "Officer Audit", UserRole.SECURITY_OFFICER);
        officer.setEmailVerified(true);
        officer.setStatus(UserStatus.ACTIVE);
        userRepository.save(officer);

        student = new UserEntity("student.audit@uom.lk", passwordEncoder.encode("Password123!"), "Student Audit", UserRole.STUDENT);
        student.setEmailVerified(true);
        student.setStatus(UserStatus.ACTIVE);
        userRepository.save(student);

        adminToken = jwtTokenService.generateToken(superAdmin);
        officerToken = jwtTokenService.generateToken(officer);
        studentToken = jwtTokenService.generateToken(student);
    }

    @Test
    @DisplayName("Operations record immutable audit logs that Super Admin can query with filters")
    void testAuditTrail_RecordingAndQuerying() throws Exception {
        // Trigger an audited admin operation: Category creation
        CreateCategoryRequest categoryRequest = new CreateCategoryRequest("AuditCategory-" + UUID.randomUUID(), "Test audit category", true);
        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(categoryRequest)))
                .andExpect(status().isCreated());

        // Verify audit log exists
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("action", "CATEGORY_CREATED")
                        .param("entityType", "CATEGORY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].action", equalTo("CATEGORY_CREATED")))
                .andExpect(jsonPath("$.content[0].outcome", equalTo("SUCCESS")));
    }

    @Test
    @DisplayName("Super Admin can retrieve specific audit log record by ID")
    void testGetAuditLogById() throws Exception {
        AuditLogEntity entry = auditService.record(
                superAdmin.getId(),
                superAdmin.getEmail(),
                "SUPER_ADMIN",
                "SECURITY_POLICY_CHECKED",
                "SYSTEM",
                "123",
                "SUCCESS",
                "Audit verification checkpoint",
                "127.0.0.1"
        );
        assertNotNull(entry);

        mockMvc.perform(get("/api/v1/admin/audit-logs/" + entry.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo(entry.getId().toString())))
                .andExpect(jsonPath("$.action", equalTo("SECURITY_POLICY_CHECKED")))
                .andExpect(jsonPath("$.entityType", equalTo("SYSTEM")))
                .andExpect(jsonPath("$.metadata", equalTo("Audit verification checkpoint")));
    }

    @Test
    @DisplayName("Students and Officers cannot access administrative audit logs (403 Forbidden)")
    void testAuditTrail_RestrictedToSuperAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Audit logs are append-only; update and delete requests are rejected")
    void testAuditTrail_AppendOnly() throws Exception {
        UUID randomId = UUID.randomUUID();

        // DELETE /api/v1/admin/audit-logs/{id} does not exist
        mockMvc.perform(delete("/api/v1/admin/audit-logs/" + randomId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());

        // PUT /api/v1/admin/audit-logs/{id} does not exist
        mockMvc.perform(put("/api/v1/admin/audit-logs/" + randomId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());
    }

    @Test
    @DisplayName("Sensitive credentials, JWT tokens, and passwords are sanitized before persistence")
    void testAuditTrail_SanitizesSensitiveData() {
        String sensitivePayload = "action=login, password=SuperSecretPassword123, bearer=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

        AuditLogEntity entry = auditService.record(
                student.getId(),
                student.getEmail(),
                "STUDENT",
                "SECURITY_CHECK",
                "USER",
                student.getId().toString(),
                "SUCCESS",
                sensitivePayload,
                "127.0.0.1"
        );

        assertNotNull(entry);
        assertFalse(entry.getMetadata().contains("SuperSecretPassword123"));
        assertFalse(entry.getMetadata().contains("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"));
    }
}
