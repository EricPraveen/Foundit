package com.campusfind.features.auth;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.auth.UserStatus;
import com.campusfind.features.audit.AuditService;
import com.campusfind.features.auth.dto.AuthResponse;
import com.campusfind.features.auth.dto.LoginRequest;
import com.campusfind.features.auth.dto.MessageResponse;
import com.campusfind.features.auth.dto.RegisterRequest;
import com.campusfind.features.auth.dto.UserResponse;
import com.campusfind.infrastructure.email.EmailService;
import com.campusfind.infrastructure.persistence.entity.EmailVerificationTokenEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.EmailVerificationTokenRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.security.JwtTokenService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final String UOM_DOMAIN = "uom.lk";

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final EmailService emailService;
    private final AuditService auditService;
    private final long verificationTokenExpiryHours;

    public AuthService(
            UserRepository userRepository,
            EmailVerificationTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService,
            EmailService emailService,
            AuditService auditService,
            @Value("${auth.verification-token-expiry-hours:24}") long verificationTokenExpiryHours) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.emailService = emailService;
        this.auditService = auditService;
        this.verificationTokenExpiryHours = verificationTokenExpiryHours;
    }

    public static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean isValidUomEmail(String email) {
        if (email == null) {
            return false;
        }
        String normalized = normalizeEmail(email);
        int atIndex = normalized.indexOf('@');
        if (atIndex <= 0 || atIndex != normalized.lastIndexOf('@')) {
            return false;
        }
        String localPart = normalized.substring(0, atIndex);
        String domain = normalized.substring(atIndex + 1);

        // Institutional rule: exact domain "uom.lk" only (reject subdomains and lookalikes)
        if (!UOM_DOMAIN.equals(domain)) {
            return false;
        }

        return localPart.matches("^[a-zA-Z0-9._%+-]+$");
    }

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", ex);
        }
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        if (!isValidUomEmail(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Registration is restricted to official @uom.lk institutional email addresses only.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email address is already registered.");
        }

        // Public registration assigns ONLY the STUDENT role
        UserEntity user = new UserEntity(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.fullName().trim(),
                UserRole.STUDENT);

        userRepository.save(user);

        // Create secure single-use verification token
        String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        Instant expiresAt = Instant.now().plus(verificationTokenExpiryHours, ChronoUnit.HOURS);

        EmailVerificationTokenEntity tokenEntity = new EmailVerificationTokenEntity(user, tokenHash, expiresAt);
        tokenRepository.save(tokenEntity);

        emailService.sendVerificationEmail(normalizedEmail, rawToken);

        auditService.recordSuccess(
                user.getId(),
                normalizedEmail,
                "STUDENT",
                "USER_REGISTERED",
                "USER",
                user.getId().toString(),
                "Student account registered awaiting verification");

        return new MessageResponse("Registration successful. Please check your @uom.lk inbox to verify your account.");
    }

    @Transactional
    public MessageResponse verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification token is required.");
        }

        String tokenHash = hashToken(rawToken.trim());
        EmailVerificationTokenEntity token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token."));

        if (token.isUsed()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification token has already been used.");
        }

        if (token.isExpired()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Verification token has expired. Please request a new verification link.");
        }

        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        UserEntity user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        auditService.recordSuccess(
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                "USER_EMAIL_VERIFIED",
                "USER",
                user.getId().toString(),
                "Account email successfully verified");

        return new MessageResponse("Email successfully verified! You may now log in to Foundit.");
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        String normalizedEmail = normalizeEmail(email);
        String genericSuccess = "If an unverified account exists for this email, a new verification link has been sent.";

        if (!isValidUomEmail(normalizedEmail)) {
            return new MessageResponse(genericSuccess);
        }

        userRepository.findByEmail(normalizedEmail).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                // Invalidate all pending unused tokens for this user
                List<EmailVerificationTokenEntity> activeTokens =
                        tokenRepository.findAllByUserAndUsedAtIsNull(user);
                Instant now = Instant.now();
                activeTokens.forEach(t -> t.setUsedAt(now));
                tokenRepository.saveAll(activeTokens);

                // Issue new token
                String rawToken = UUID.randomUUID().toString() + "-" + UUID.randomUUID().toString();
                String tokenHash = hashToken(rawToken);
                Instant expiresAt = now.plus(verificationTokenExpiryHours, ChronoUnit.HOURS);

                EmailVerificationTokenEntity newToken = new EmailVerificationTokenEntity(user, tokenHash, expiresAt);
                tokenRepository.save(newToken);

                emailService.sendVerificationEmail(user.getEmail(), rawToken);
            }
        });

        return new MessageResponse(genericSuccess);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());

        UserEntity user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            auditService.recordFailure(
                    null,
                    normalizedEmail,
                    "ANONYMOUS",
                    "USER_LOGIN_FAILED",
                    "USER",
                    null,
                    "Login failed: User not found");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditService.recordFailure(
                    user.getId(),
                    normalizedEmail,
                    user.getRole().name(),
                    "USER_LOGIN_FAILED",
                    "USER",
                    user.getId().toString(),
                    "Login failed: Invalid credentials");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }

        if (!user.isEmailVerified()) {
            auditService.recordFailure(
                    user.getId(),
                    normalizedEmail,
                    user.getRole().name(),
                    "USER_LOGIN_FAILED",
                    "USER",
                    user.getId().toString(),
                    "Login failed: Email unverified");
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Account email is not verified. Please verify your @uom.lk email before logging in.");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            auditService.recordFailure(
                    user.getId(),
                    normalizedEmail,
                    user.getRole().name(),
                    "USER_LOGIN_FAILED",
                    "USER",
                    user.getId().toString(),
                    "Login failed: Account suspended or deactivated");
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Account is currently suspended or deactivated. Please contact the administrator.");
        }

        auditService.recordSuccess(
                user.getId(),
                normalizedEmail,
                user.getRole().name(),
                "USER_LOGIN_SUCCESS",
                "USER",
                user.getId().toString(),
                "User login successful");

        String accessToken = jwtTokenService.generateToken(user);
        return AuthResponse.bearer(accessToken, jwtTokenService.getExpirationMs() / 1000, UserResponse.fromEntity(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        UserEntity user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found."));
        return UserResponse.fromEntity(user);
    }
}
