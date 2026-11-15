package com.campusfind.features.notification;

import com.campusfind.domain.notification.EmailDeliveryStatus;
import com.campusfind.domain.notification.NotificationEntityType;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.features.notification.dto.NotificationResponse;
import com.campusfind.features.notification.dto.UnreadCountResponse;
import com.campusfind.infrastructure.email.EmailService;
import com.campusfind.infrastructure.persistence.entity.NotificationEmailDeliveryEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.NotificationEmailDeliveryRepository;
import com.campusfind.infrastructure.persistence.repository.NotificationRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final NotificationEmailDeliveryRepository emailDeliveryRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationProperties notificationProperties;

    public NotificationService(
            NotificationRepository notificationRepository,
            NotificationEmailDeliveryRepository emailDeliveryRepository,
            UserRepository userRepository,
            EmailService emailService,
            NotificationProperties notificationProperties) {
        this.notificationRepository = notificationRepository;
        this.emailDeliveryRepository = emailDeliveryRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.notificationProperties = notificationProperties;
    }

    @Transactional
    public NotificationEntity createInAppNotification(
            UserEntity recipient,
            NotificationType type,
            String title,
            String message,
            NotificationEntityType entityType,
            UUID entityId) {

        NotificationEntity notification = new NotificationEntity(
                recipient,
                type,
                title,
                message,
                entityType,
                entityId
        );
        NotificationEntity saved = notificationRepository.save(notification);
        log.info("Created in-app notification [{}] for user [{}]", type, recipient.getId());
        return saved;
    }

    @Transactional
    public void queueEmailNotification(
            NotificationEntity notification,
            String recipientEmail,
            String subject,
            String body) {

        if (!notificationProperties.isEmailEnabled() || recipientEmail == null || recipientEmail.isBlank()) {
            return;
        }

        NotificationEmailDeliveryEntity delivery = new NotificationEmailDeliveryEntity(
                notification,
                recipientEmail,
                subject,
                body
        );

        Instant now = Instant.now();
        delivery.setLastAttemptAt(now);
        delivery.setAttemptCount(1);

        try {
            emailService.sendNotificationEmail(recipientEmail, subject, body);
            delivery.setStatus(EmailDeliveryStatus.SENT);
            log.info("Email notification [{}] delivered successfully to [{}]", subject, recipientEmail);
        } catch (Exception e) {
            log.warn("Failed immediate email dispatch to [{}]: {}. Scheduling retry.", recipientEmail, e.getMessage());
            delivery.setStatus(EmailDeliveryStatus.RETRY_SCHEDULED);
            delivery.setNextRetryAt(now.plusSeconds(notificationProperties.getEmailRetryDelaySeconds()));
            delivery.setErrorMessage(e.getMessage());
        }

        emailDeliveryRepository.save(delivery);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(String userEmail, Pageable pageable) {
        UserEntity user = getUserByEmail(userEmail);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        long count = notificationRepository.countByRecipientIdAndReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        NotificationEntity notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: " + notificationId));

        // Anti-IDOR: verify recipient ownership
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: " + notificationId);
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }

        return mapToResponse(notification);
    }

    @Transactional
    public void markAllAsRead(String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadByRecipientId(user.getId(), Instant.now());
        log.info("Marked all notifications as read for user [{}]", user.getId());
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }

    private NotificationResponse mapToResponse(NotificationEntity entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getNotificationType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getRelatedEntityType(),
                entity.getRelatedEntityId(),
                entity.isRead(),
                entity.getReadAt(),
                entity.getCreatedAt()
        );
    }
}
