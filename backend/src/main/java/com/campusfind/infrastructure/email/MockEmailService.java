package com.campusfind.infrastructure.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(type = "org.springframework.mail.javamail.JavaMailSender")
public class MockEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(MockEmailService.class);

    @Override
    public void sendVerificationEmail(String toEmail, String token) {
        log.info("Simulated email dispatch: Verification email prepared for recipient [{}]", toEmail);
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String token) {
        log.info("Simulated email dispatch: Password reset email prepared for recipient [{}]", toEmail);
    }

    @Override
    public void sendNotificationEmail(String toEmail, String subject, String body) {
        log.info("Simulated email dispatch: Notification email [{}] prepared for recipient [{}]", subject, toEmail);
    }
}
