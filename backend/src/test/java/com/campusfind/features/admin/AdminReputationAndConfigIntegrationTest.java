package com.campusfind.features.admin;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.features.admin.dto.UpdateReputationRuleRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.CategoryReputationRuleRepository;
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
class AdminReputationAndConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryReputationRuleRepository ruleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity superAdmin;
    private UserEntity student;
    private String adminToken;
    private String studentToken;
    private CategoryReputationRuleEntity testRule;

    @BeforeEach
    void setUp() {
        superAdmin = new UserEntity("admin.cfg@uom.lk", passwordEncoder.encode("Password123!"), "Admin Cfg", UserRole.SUPER_ADMIN);
        superAdmin.setEmailVerified(true);
        superAdmin.setStatus(UserStatus.ACTIVE);
        userRepository.save(superAdmin);

        student = new UserEntity("student.cfg@uom.lk", passwordEncoder.encode("Password123!"), "Student Cfg", UserRole.STUDENT);
        student.setEmailVerified(true);
        student.setStatus(UserStatus.ACTIVE);
        userRepository.save(student);

        adminToken = jwtTokenService.generateToken(superAdmin);
        studentToken = jwtTokenService.generateToken(student);

        CategoryEntity category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(new CategoryEntity("Electronics", "Electronics", true)));

        testRule = ruleRepository.findByCategoryIdAndTransactionTypeAndActiveTrue(category.getId(), ReputationTransactionType.FOUND_ITEM_HANDOVER)
                .orElseGet(() -> ruleRepository.save(new CategoryReputationRuleEntity(category, ReputationTransactionType.FOUND_ITEM_HANDOVER, 25, true)));
    }

    @Test
    @DisplayName("Super Admin can list all category reputation rules")
    void testListReputationRules_ReturnsRules() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reputation-rules")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Super Admin can update reputation rule points and active status")
    void testUpdateReputationRule_PointsAndActive() throws Exception {
        UpdateReputationRuleRequest request = new UpdateReputationRuleRequest(40, true);

        mockMvc.perform(put("/api/v1/admin/reputation-rules/" + testRule.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.points", equalTo(40)))
                .andExpect(jsonPath("$.active", equalTo(true)));

        CategoryReputationRuleEntity updated = ruleRepository.findById(testRule.getId()).orElseThrow();
        assertEquals(40, updated.getPoints());
    }

    @Test
    @DisplayName("Super Admin can inspect system operational configuration")
    void testGetSystemConfig_ReturnsOperationalPolicies() throws Exception {
        mockMvc.perform(get("/api/v1/admin/system-config")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unclaimedThresholdDays", equalTo(30)))
                .andExpect(jsonPath("$.handoverReminderIntervalHours", equalTo(24)))
                .andExpect(jsonPath("$.emailNotificationsEnabled", equalTo(true)));
    }

    @Test
    @DisplayName("Non-admins cannot access reputation rule calibration or system config (403 Forbidden)")
    void testNonAdmin_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/admin/reputation-rules")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/system-config")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }
}
