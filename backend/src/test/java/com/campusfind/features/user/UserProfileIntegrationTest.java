package com.campusfind.features.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.features.user.dto.UpdateProfileRequest;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
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
class UserProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private UserEntity student;
    private String studentToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        student = new UserEntity("student@uom.lk", passwordEncoder.encode("SecretPass1"), "Original Name", UserRole.STUDENT);
        student.setEmailVerified(true);
        student.setPhoneNumber("+94771234567");
        student.setIndexNumber("220001A");
        student.setIndexNumberVerified(false);
        userRepository.save(student);

        studentToken = jwtTokenService.generateToken(student);
    }

    @Test
    @DisplayName("Authenticated student can retrieve their own safe profile")
    void getMyProfileSucceeds() throws Exception {
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(student.getId().toString()))
                .andExpect(jsonPath("$.email").value("student@uom.lk"))
                .andExpect(jsonPath("$.fullName").value("Original Name"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.indexNumber").value("220001A"))
                .andExpect(jsonPath("$.indexNumberVerified").value(false))
                .andExpect(jsonPath("$.passwordHash").doesNotExist()) // Never exposed
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("Authenticated student can update permitted profile fields")
    void updateMyProfileSucceeds() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest(
                "Updated Student Name",
                "+94779876543",
                "220002B");

        mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Student Name"))
                .andExpect(jsonPath("$.phoneNumber").value("+94779876543"))
                .andExpect(jsonPath("$.indexNumber").value("220002B"))
                .andExpect(jsonPath("$.indexNumberVerified").value(false));

        UserEntity updated = userRepository.findById(student.getId()).orElseThrow();
        assertThat(updated.getFullName()).isEqualTo("Updated Student Name");
        assertThat(updated.getPhoneNumber()).isEqualTo("+94779876543");
        assertThat(updated.getIndexNumber()).isEqualTo("220002B");
        assertThat(updated.getRole()).isEqualTo(UserRole.STUDENT); // Role unchanged
    }

    @Test
    @DisplayName("Unauthenticated request to profile endpoint returns 401 Unauthorized")
    void unauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());
    }
}
