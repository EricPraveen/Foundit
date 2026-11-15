package com.campusfind.infrastructure.email;

public interface EmailService {

    void sendVerificationEmail(String toEmail, String token);

    void sendPasswordResetEmail(String toEmail, String token);

    void sendNotificationEmail(String toEmail, String subject, String body);
}
