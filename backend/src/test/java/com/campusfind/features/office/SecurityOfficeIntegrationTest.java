package com.campusfind.features.office;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.office.dto.CreateOfficerRequest;
import com.campusfind.features.office.dto.UpdateSecurityOfficeRequest;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityOfficeIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SecurityOfficeRepository officeRepository;

    @Autowired
    private SecurityOfficerProfileRepository officerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private String adminToken;
    private String studentToken;
    private SecurityOfficeEntity centralOffice;

    @BeforeEach
    void setUp() {
        officerProfileRepository.deleteAll();
        userRepository.deleteAll();
        officeRepository.deleteAll();

        centralOffice = new SecurityOfficeEntity(
                "Central Security Office",
                "Administration Block, UoM",
                "security@uom.lk",
                "+94112650301",
                "24/7 Service");
        officeRepository.save(centralOffice);

        UserEntity admin = new UserEntity("admin@uom.lk", passwordEncoder.encode("AdminPass1"), "Admin User", UserRole.SUPER_ADMIN);
        admin.setEmailVerified(true);
        userRepository.save(admin);
        adminToken = jwtTokenService.generateToken(admin);

        UserEntity student = new UserEntity("student@uom.lk", passwordEncoder.encode("StudentPass1"), "Student User", UserRole.STUDENT);
        student.setEmailVerified(true);
        userRepository.save(student);
        studentToken = jwtTokenService.generateToken(student);
    }

    @Test
    @DisplayName("Public/Student can retrieve Central Security Office details")
    void getCentralOfficePublicly() throws Exception {
        mockMvc.perform(get("/api/v1/security-office"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Central Security Office"))
                .andExpect(jsonPath("$.campusLocation").value("Administration Block, UoM"))
                .andExpect(jsonPath("$.contactEmail").value("security@uom.lk"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    @DisplayName("Super Admin can update Central Security Office details")
    void superAdminUpdatesOffice() throws Exception {
        UpdateSecurityOfficeRequest request = new UpdateSecurityOfficeRequest(
                "UoM Central Security Office",
                "Ground Floor, Main Admin Complex",
                "chief.security@uom.lk",
                "+94112650999",
                "Open 24 Hours");

        mockMvc.perform(put("/api/v1/admin/security-office")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("UoM Central Security Office"))
                .andExpect(jsonPath("$.campusLocation").value("Ground Floor, Main Admin Complex"))
                .andExpect(jsonPath("$.contactEmail").value("chief.security@uom.lk"));
    }

    @Test
    @DisplayName("Student cannot update Central Security Office (403 Forbidden)")
    void studentCannotUpdateOffice() throws Exception {
        UpdateSecurityOfficeRequest request = new UpdateSecurityOfficeRequest(
                "Hacked Office", "Nowhere", "hacker@uom.lk", "+94000", "Never");

        mockMvc.perform(put("/api/v1/admin/security-office")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Super Admin can provision Security Officer account")
    void superAdminProvisionsOfficer() throws Exception {
        CreateOfficerRequest request = new CreateOfficerRequest(
                "officer.fernando@uom.lk",
                "Officer K. Fernando",
                "OfficerSecret123",
                "BADGE-8088");

        mockMvc.perform(post("/api/v1/admin/officers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("officer.fernando@uom.lk"))
                .andExpect(jsonPath("$.fullName").value("Officer K. Fernando"))
                .andExpect(jsonPath("$.role").value("SECURITY_OFFICER"))
                .andExpect(jsonPath("$.badgeNumber").value("BADGE-8088"))
                .andExpect(jsonPath("$.officeName").value("Central Security Office"));

        UserEntity createdUser = userRepository.findByEmail("officer.fernando@uom.lk").orElseThrow();
        assertThat(createdUser.getRole()).isEqualTo(UserRole.SECURITY_OFFICER);
        assertThat(createdUser.isEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("Student cannot provision Security Officer account (403 Forbidden)")
    void studentCannotProvisionOfficer() throws Exception {
        CreateOfficerRequest request = new CreateOfficerRequest(
                "fake.officer@uom.lk", "Fake Officer", "OfficerPass123", "BADGE-0000");

        mockMvc.perform(post("/api/v1/admin/officers")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Super Admin can list all provisioned Security Officers")
    void superAdminListsOfficers() throws Exception {
        CreateOfficerRequest request = new CreateOfficerRequest(
                "officer.silva@uom.lk", "Officer M. Silva", "OfficerPass123", "BADGE-1001");
        mockMvc.perform(post("/api/v1/admin/officers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/officers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("officer.silva@uom.lk"))
                .andExpect(jsonPath("$[0].badgeNumber").value("BADGE-1001"));
    }
}
