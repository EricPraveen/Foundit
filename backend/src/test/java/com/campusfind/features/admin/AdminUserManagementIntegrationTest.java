package com.campusfind.features.admin;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.admin.dto.UpdateUserRoleRequest;
import com.campusfind.features.admin.dto.UpdateUserStatusRequest;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class AdminUserManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity superAdmin;
    private UserEntity studentVerified;
    private UserEntity studentUnverified;
    private String adminToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        officeRepository.findFirstByActiveTrue()
                .orElseGet(() -> officeRepository.save(new SecurityOfficeEntity("Central Security Office", "Main Gate", "0112650301", "sec@uom.lk", "24/7")));

        superAdmin = new UserEntity("superadmin@uom.lk", passwordEncoder.encode("Password123!"), "Super Administrator", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        superAdmin.setStatus(UserStatus.ACTIVE);
        userRepository.save(superAdmin);

        studentVerified = new UserEntity("alice.adminuser@uom.lk", passwordEncoder.encode("Password123!"), "Alice AdminUser", UserRole.STUDENT);
        studentVerified.setEmailVerified(true);
        studentVerified.setStatus(UserStatus.ACTIVE);
        studentVerified.setIndexNumber("204001A");
        userRepository.save(studentVerified);

        studentUnverified = new UserEntity("bob.adminuser@uom.lk", passwordEncoder.encode("Password123!"), "Bob AdminUser", UserRole.STUDENT);
        studentUnverified.setEmailVerified(false);
        studentUnverified.setStatus(UserStatus.DEACTIVATED);
        userRepository.save(studentUnverified);

        adminToken = jwtTokenService.generateToken(superAdmin);
        studentToken = jwtTokenService.generateToken(studentVerified);
    }

    @Test
    @DisplayName("Super Admin can list users with keyword query, role, and status filtering")
    void testListUsers_WithSearchAndFilters() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", "Alice")
                        .param("role", "STUDENT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()", equalTo(1)))
                .andExpect(jsonPath("$.content[0].email", equalTo("alice.adminuser@uom.lk")));
    }

    @Test
    @DisplayName("Super Admin can retrieve detailed user profile")
    void testGetUserById_ReturnsFullProfile() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users/" + studentVerified.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", equalTo(studentVerified.getId().toString())))
                .andExpect(jsonPath("$.email", equalTo("alice.adminuser@uom.lk")))
                .andExpect(jsonPath("$.indexNumber", equalTo("204001A")))
                .andExpect(jsonPath("$.emailVerified", equalTo(true)));
    }

    @Test
    @DisplayName("Super Admin can update user status to SUSPENDED")
    void testUpdateUserStatus_SuspendUser() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.SUSPENDED, "Violation of platform policy");

        mockMvc.perform(patch("/api/v1/admin/users/" + studentVerified.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", equalTo("SUSPENDED")));

        UserEntity updated = userRepository.findById(studentVerified.getId()).orElseThrow();
        assertEquals(UserStatus.SUSPENDED, updated.getStatus());
    }

    @Test
    @DisplayName("Cannot activate an unverified account (400 Bad Request)")
    void testUpdateUserStatus_FailsToActivateUnverifiedUser() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.ACTIVE, "Attempting activation");

        mockMvc.perform(patch("/api/v1/admin/users/" + studentUnverified.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("Cannot activate an unverified account. The user must verify their university email address first.")));
    }

    @Test
    @DisplayName("Cannot deactivate or suspend the last active Super Admin (400 Bad Request)")
    void testUpdateUserStatus_FailsToDeactivateLastSuperAdmin() throws Exception {
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.DEACTIVATED, "Demoting self");

        mockMvc.perform(patch("/api/v1/admin/users/" + superAdmin.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("Cannot deactivate or suspend the last active Super Admin account.")));
    }

    @Test
    @DisplayName("Promoting a student to SECURITY_OFFICER creates an officer profile linked to Central Office")
    void testUpdateUserRole_PromoteStudentToOfficer() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.SECURITY_OFFICER, "OFF-PROV-999", "Assigned to gate duties");

        mockMvc.perform(patch("/api/v1/admin/users/" + studentVerified.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", equalTo("SECURITY_OFFICER")))
                .andExpect(jsonPath("$.badgeNumber", equalTo("OFF-PROV-999")))
                .andExpect(jsonPath("$.securityOfficeName", equalTo("Central Security Office")));

        UserEntity updated = userRepository.findById(studentVerified.getId()).orElseThrow();
        assertEquals(UserRole.SECURITY_OFFICER, updated.getRole());
        assertTrue(officerProfileRepository.findById(studentVerified.getId()).isPresent());
    }

    @Test
    @DisplayName("Cannot demote the last active Super Admin (400 Bad Request)")
    void testUpdateUserRole_FailsToDemoteLastSuperAdmin() throws Exception {
        UpdateUserRoleRequest request = new UpdateUserRoleRequest(UserRole.STUDENT, null, "Demotion");

        mockMvc.perform(patch("/api/v1/admin/users/" + superAdmin.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", equalTo("Cannot demote the last active Super Admin account.")));
    }

    @Test
    @DisplayName("Non-admins cannot access admin user management endpoints (403 Forbidden)")
    void testNonAdmin_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/admin/users/" + studentVerified.getId() + "/status")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DEACTIVATED\"}"))
                .andExpect(status().isForbidden());
    }
}
