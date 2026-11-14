package com.campusfind.features.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.infrastructure.persistence.entity.EmailVerificationTokenEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.EmailVerificationTokenRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailVerificationTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    @BeforeEach
    void cleanDatabase() {
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("University Account Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Valid @uom.lk email registration succeeds and assigns STUDENT role")
        void validUomRegistrationSucceeds() throws Exception {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "220313M@uom.lk",
                    "password", "SecureP@ss123",
                    "fullName", "Praveen Eric"
            ));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.message").value("Registration successful. Please check your @uom.lk inbox to verify your account."));

            UserEntity savedUser = userRepository.findByEmail("220313m@uom.lk").orElseThrow();
            assertThat(savedUser.getFullName()).isEqualTo("Praveen Eric");
            assertThat(savedUser.getRole()).isEqualTo(UserRole.STUDENT);
            assertThat(savedUser.isEmailVerified()).isFalse();
            assertThat(passwordEncoder.matches("SecureP@ss123", savedUser.getPasswordHash())).isTrue();
            assertThat(savedUser.getPasswordHash()).doesNotContain("SecureP@ss123"); // Not stored in plaintext
        }

        @Test
        @DisplayName("External domains like @gmail.com are strictly rejected")
        void externalDomainRejected() throws Exception {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "student@gmail.com",
                    "password", "SecureP@ss123",
                    "fullName", "Fake Student"
            ));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Registration is restricted to official @uom.lk institutional email addresses only."));
        }

        @Test
        @DisplayName("Subdomains like @student.uom.lk are strictly rejected")
        void subdomainRejected() throws Exception {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "student@student.uom.lk",
                    "password", "SecureP@ss123",
                    "fullName", "Subdomain User"
            ));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Lookalike domains like @fakeuom.lk or @uom.lk.com are rejected")
        void lookalikeDomainRejected() throws Exception {
            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "student@uom.lk.fake.com",
                    "password", "SecureP@ss123",
                    "fullName", "Lookalike User"
            ));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Duplicate email registration returns 409 Conflict")
        void duplicateEmailRejected() throws Exception {
            UserEntity existingUser = new UserEntity("student@uom.lk", passwordEncoder.encode("Secret1234"), "Existing Student", UserRole.STUDENT);
            userRepository.save(existingUser);

            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "STUDENT@uom.lk", // case variation
                    "password", "NewPassword123",
                    "fullName", "Duplicate Attempt"
            ));

            mockMvc.perform(post("/api/v1/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("An account with this email address is already registered."));
        }
    }

    @Nested
    @DisplayName("Email Verification Tests")
    class EmailVerificationTests {

        @Test
        @DisplayName("Valid token verifies account successfully")
        void validTokenVerifiesAccount() throws Exception {
            UserEntity user = new UserEntity("unverified@uom.lk", passwordEncoder.encode("Pass12345"), "Unverified Student", UserRole.STUDENT);
            userRepository.save(user);

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = AuthService.hashToken(rawToken);
            EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(
                    user, tokenHash, Instant.now().plus(24, ChronoUnit.HOURS));
            tokenRepository.save(tokenEntity);

            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", rawToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Email successfully verified! You may now log in to Foundit."));

            UserEntity updatedUser = userRepository.findById(user.getId()).orElseThrow();
            assertThat(updatedUser.isEmailVerified()).isTrue();

            EmailVerificationTokenEntity updatedToken = tokenRepository.findByTokenHash(tokenHash).orElseThrow();
            assertThat(updatedToken.isUsed()).isTrue();
        }

        @Test
        @DisplayName("Reused token is rejected")
        void reusedTokenRejected() throws Exception {
            UserEntity user = new UserEntity("verified@uom.lk", passwordEncoder.encode("Pass12345"), "Student", UserRole.STUDENT);
            user.setEmailVerified(true);
            userRepository.save(user);

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = AuthService.hashToken(rawToken);
            EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(
                    user, tokenHash, Instant.now().plus(24, ChronoUnit.HOURS));
            tokenEntity.setUsedAt(Instant.now().minus(1, ChronoUnit.HOURS));
            tokenRepository.save(tokenEntity);

            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", rawToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Verification token has already been used."));
        }

        @Test
        @DisplayName("Expired token is rejected")
        void expiredTokenRejected() throws Exception {
            UserEntity user = new UserEntity("expired@uom.lk", passwordEncoder.encode("Pass12345"), "Student", UserRole.STUDENT);
            userRepository.save(user);

            String rawToken = UUID.randomUUID().toString();
            String tokenHash = AuthService.hashToken(rawToken);
            EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(
                    user, tokenHash, Instant.now().minus(2, ChronoUnit.HOURS)); // expired
            tokenRepository.save(tokenEntity);

            mockMvc.perform(get("/api/v1/auth/verify-email").param("token", rawToken))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Verification token has expired. Please request a new verification link."));
        }
    }

    @Nested
    @DisplayName("Login & JWT Authentication Tests")
    class LoginTests {

        @Test
        @DisplayName("Verified user logs in successfully and receives JWT")
        void verifiedUserLoginSucceeds() throws Exception {
            UserEntity user = new UserEntity("active@uom.lk", passwordEncoder.encode("Password123"), "Active Student", UserRole.STUDENT);
            user.setEmailVerified(true);
            userRepository.save(user);

            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "ACTIVE@uom.lk",
                    "password", "Password123"
            ));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.user.email").value("active@uom.lk"))
                    .andExpect(jsonPath("$.user.role").value("STUDENT"));
        }

        @Test
        @DisplayName("Unverified user login is rejected with 403 Forbidden")
        void unverifiedUserLoginForbidden() throws Exception {
            UserEntity user = new UserEntity("pending@uom.lk", passwordEncoder.encode("Password123"), "Pending Student", UserRole.STUDENT);
            user.setEmailVerified(false);
            userRepository.save(user);

            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "pending@uom.lk",
                    "password", "Password123"
            ));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.message").value("Account email is not verified. Please verify your @uom.lk email before logging in."));
        }

        @Test
        @DisplayName("Invalid password returns 401 Unauthorized")
        void invalidPasswordUnauthorized() throws Exception {
            UserEntity user = new UserEntity("active@uom.lk", passwordEncoder.encode("CorrectPassword"), "Student", UserRole.STUDENT);
            user.setEmailVerified(true);
            userRepository.save(user);

            String payload = objectMapper.writeValueAsString(Map.of(
                    "email", "active@uom.lk",
                    "password", "WrongPassword"
            ));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password."));
        }
    }

    @Nested
    @DisplayName("Role-Based Access Control (RBAC) Tests")
    class RbacTests {

        @Test
        @DisplayName("STUDENT can access /auth/me but cannot access officer or admin endpoints")
        void studentRoleRestrictions() throws Exception {
            UserEntity student = new UserEntity("student1@uom.lk", passwordEncoder.encode("Pass123"), "Student One", UserRole.STUDENT);
            student.setEmailVerified(true);
            userRepository.save(student);

            String token = jwtTokenService.generateToken(student);

            // Access own profile -> OK
            mockMvc.perform(get("/api/v1/auth/me")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.email").value("student1@uom.lk"))
                    .andExpect(jsonPath("$.role").value("STUDENT"));

            // Access officer endpoint -> Forbidden 403
            mockMvc.perform(get("/api/v1/auth/officer-only")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());

            // Access admin endpoint -> Forbidden 403
            mockMvc.perform(get("/api/v1/auth/admin-only")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("SECURITY_OFFICER can access officer-only but cannot access admin-only endpoint")
        void officerRoleRestrictions() throws Exception {
            UserEntity officer = new UserEntity("officer@uom.lk", passwordEncoder.encode("Pass123"), "Officer Silva", UserRole.SECURITY_OFFICER);
            officer.setEmailVerified(true);
            userRepository.save(officer);

            String token = jwtTokenService.generateToken(officer);

            // Access officer endpoint -> OK
            mockMvc.perform(get("/api/v1/auth/officer-only")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Authorized for Security Officer"));

            // Access admin endpoint -> Forbidden 403
            mockMvc.perform(get("/api/v1/auth/admin-only")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }

        @Test
        @DisplayName("SUPER_ADMIN can access admin-only endpoint")
        void superAdminAccess() throws Exception {
            UserEntity admin = new UserEntity("admin@uom.lk", passwordEncoder.encode("Pass123"), "Admin Perera", UserRole.SUPER_ADMIN);
            admin.setEmailVerified(true);
            userRepository.save(admin);

            String token = jwtTokenService.generateToken(admin);

            mockMvc.perform(get("/api/v1/auth/admin-only")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Authorized for Super Admin"));
        }

        @Test
        @DisplayName("Unauthenticated request to protected endpoint returns 401 Unauthorized")
        void unauthenticatedRequestUnauthorized() throws Exception {
            mockMvc.perform(get("/api/v1/auth/me"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
