package com.campusfind.features.notification.scheduler;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.domain.notification.EmailDeliveryStatus;
import com.campusfind.domain.notification.NotificationEntityType;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.features.notification.NotificationProperties;
import com.campusfind.features.notification.NotificationService;
import com.campusfind.infrastructure.email.EmailService;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.HandoverReminderLogEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEmailDeliveryEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UnclaimedEscalationLogEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.HandoverReminderLogRepository;
import com.campusfind.infrastructure.persistence.repository.NotificationEmailDeliveryRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UnclaimedEscalationLogRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReminderSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(ReminderSchedulerService.class);

    private final FoundItemRepository foundItemRepository;
    private final HandoverReminderLogRepository handoverReminderLogRepository;
    private final UnclaimedEscalationLogRepository unclaimedEscalationLogRepository;
    private final NotificationEmailDeliveryRepository emailDeliveryRepository;
    private final SecurityOfficerProfileRepository officerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final NotificationProperties notificationProperties;

    public ReminderSchedulerService(
            FoundItemRepository foundItemRepository,
            HandoverReminderLogRepository handoverReminderLogRepository,
            UnclaimedEscalationLogRepository unclaimedEscalationLogRepository,
            NotificationEmailDeliveryRepository emailDeliveryRepository,
            SecurityOfficerProfileRepository officerProfileRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            EmailService emailService,
            NotificationProperties notificationProperties) {
        this.foundItemRepository = foundItemRepository;
        this.handoverReminderLogRepository = handoverReminderLogRepository;
        this.unclaimedEscalationLogRepository = unclaimedEscalationLogRepository;
        this.emailDeliveryRepository = emailDeliveryRepository;
        this.officerProfileRepository = officerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.notificationProperties = notificationProperties;
    }

    @Scheduled(cron = "${app.scheduling.handover-reminder-cron:0 0 * * * *}")
    @Transactional
    public int processPendingHandoverReminders() {
        log.info("Running pending handover reminder check...");
        List<FoundItemEntity> pendingItems = foundItemRepository.findByHandoverStatus(HandoverStatus.PENDING);
        Instant now = Instant.now();
        int sentCount = 0;

        for (FoundItemEntity item : pendingItems) {
            long hoursElapsed = Duration.between(item.getCreatedAt(), now).toHours();
            int cycleNumber = (int) (hoursElapsed / 24);

            if (cycleNumber < 1) {
                continue; // Not yet 24 hours old
            }

            if (handoverReminderLogRepository.existsByFoundItemIdAndCycleNumber(item.getId(), cycleNumber)) {
                continue; // Already reminded for this 24-hour cycle
            }

            UserEntity finder = item.getFinder();

            // 1. In-app reminder
            NotificationEntity notif = notificationService.createInAppNotification(
                    finder,
                    NotificationType.HANDOVER_REMINDER,
                    "Handover Reminder: " + item.getTitle(),
                    "Reminder (Day " + cycleNumber + "): Please physically bring your reported found item '" +
                            item.getTitle() + "' to the Central Security Desk to complete handover.",
                    NotificationEntityType.FOUND_ITEM,
                    item.getId()
            );

            // 2. Email reminder
            notificationService.queueEmailNotification(
                    notif,
                    finder.getEmail(),
                    "CampusFind: Handover Reminder - " + item.getTitle(),
                    "Hello " + finder.getFullName() + ",\n\nThis is a 24-hour reminder regarding your reported found item '" +
                            item.getTitle() + "'. Please physically hand it over to the Central Security Office so it can become available for student claims."
            );

            // 3. Log reminder record for idempotency
            HandoverReminderLogEntity reminderLog = new HandoverReminderLogEntity(item, finder, cycleNumber);
            handoverReminderLogRepository.save(reminderLog);
            sentCount++;
            log.info("Sent handover reminder cycle {} for item [{}] to finder [{}]", cycleNumber, item.getId(), finder.getId());
        }

        return sentCount;
    }

    @Scheduled(cron = "${app.scheduling.unclaimed-escalation-cron:0 0 2 * * *}")
    @Transactional
    public int processUnclaimedEscalations() {
        if (!notificationProperties.isUnclaimedEnabled()) {
            log.debug("Unclaimed item escalation is currently disabled by configuration");
            return 0;
        }

        int thresholdDays = notificationProperties.getUnclaimedThresholdDays();
        Instant cutoff = Instant.now().minus(thresholdDays, ChronoUnit.DAYS);
        List<FoundItemEntity> eligibleItems = foundItemRepository
                .findByAvailabilityStatusAndHandoverConfirmedAtBefore(ItemAvailabilityStatus.AVAILABLE, cutoff);

        int escalatedCount = 0;

        for (FoundItemEntity item : eligibleItems) {
            if (unclaimedEscalationLogRepository.existsByFoundItemId(item.getId())) {
                continue;
            }

            // 1. Mark status as UNCLAIMED (remains physically stored)
            item.setAvailabilityStatus(ItemAvailabilityStatus.UNCLAIMED);
            foundItemRepository.save(item);

            // 2. Record escalation log
            UnclaimedEscalationLogEntity escalationLog = new UnclaimedEscalationLogEntity(
                    item,
                    item.getDesignatedSecurityOffice(),
                    "Item remained unclaimed for " + thresholdDays + " days"
            );
            unclaimedEscalationLogRepository.save(escalationLog);

            // 3. Notify Security Officers assigned to that office
            List<SecurityOfficerProfileEntity> officerProfiles = officerProfileRepository
                    .findAllBySecurityOfficeId(item.getDesignatedSecurityOffice().getId());

            for (SecurityOfficerProfileEntity profile : officerProfiles) {
                userRepository.findById(profile.getUserId()).ifPresent(officer -> {
                    NotificationEntity notif = notificationService.createInAppNotification(
                            officer,
                            NotificationType.UNCLAIMED_ESCALATION,
                            "Unclaimed Item Notice: " + item.getTitle(),
                            "Item '" + item.getTitle() + "' has remained unclaimed at " +
                                    item.getDesignatedSecurityOffice().getName() + " for " + thresholdDays +
                                    " days and has transitioned to UNCLAIMED for administrative handling.",
                            NotificationEntityType.FOUND_ITEM,
                            item.getId()
                    );

                    notificationService.queueEmailNotification(
                            notif,
                            officer.getEmail(),
                            "CampusFind: Unclaimed Item Notice - " + item.getTitle(),
                            "Notice: Found item '" + item.getTitle() + "' has exceeded " + thresholdDays +
                                    " days unclaimed at " + item.getDesignatedSecurityOffice().getName() + "."
                    );
                });
            }

            // 4. Escalate to Super Admins
            List<UserEntity> superAdmins = userRepository.findByRole(UserRole.SUPER_ADMIN);
            for (UserEntity admin : superAdmins) {
                NotificationEntity notif = notificationService.createInAppNotification(
                        admin,
                        NotificationType.UNCLAIMED_ESCALATION,
                        "Super Admin Escalation: Unclaimed Item - " + item.getTitle(),
                        "Item '" + item.getTitle() + "' at " + item.getDesignatedSecurityOffice().getName() +
                                " has exceeded the " + thresholdDays + "-day threshold and requires administrative review.",
                        NotificationEntityType.FOUND_ITEM,
                        item.getId()
                );

                notificationService.queueEmailNotification(
                        notif,
                        admin.getEmail(),
                        "CampusFind Escalation: Unclaimed Item - " + item.getTitle(),
                        "Super Admin Escalation:\n\nItem: " + item.getTitle() +
                                "\nOffice: " + item.getDesignatedSecurityOffice().getName() +
                                "\nUnclaimed period: " + thresholdDays + " days.\n" +
                                "Please review for university-approved disposition."
                );
            }

            escalatedCount++;
            log.info("Escalated unclaimed item [{}] after {} days", item.getId(), thresholdDays);
        }

        return escalatedCount;
    }

    @Scheduled(cron = "${app.scheduling.email-retry-cron:0 */5 * * * *}")
    @Transactional
    public int retryFailedEmails() {
        List<NotificationEmailDeliveryEntity> pendingRetries = emailDeliveryRepository
                .findByStatusAndNextRetryAtLessThanEqual(EmailDeliveryStatus.RETRY_SCHEDULED, Instant.now());

        int retriedCount = 0;
        for (NotificationEmailDeliveryEntity delivery : pendingRetries) {
            int currentAttempts = delivery.getAttemptCount();

            if (currentAttempts >= notificationProperties.getMaxEmailRetries()) {
                delivery.setStatus(EmailDeliveryStatus.FAILED);
                emailDeliveryRepository.save(delivery);
                continue;
            }

            delivery.setAttemptCount(currentAttempts + 1);
            delivery.setLastAttemptAt(Instant.now());

            try {
                emailService.sendNotificationEmail(delivery.getRecipientEmail(), delivery.getSubject(), delivery.getBody());
                delivery.setStatus(EmailDeliveryStatus.SENT);
                delivery.setErrorMessage(null);
                retriedCount++;
                log.info("Retried email [{}] successfully sent to [{}]", delivery.getSubject(), delivery.getRecipientEmail());
            } catch (Exception e) {
                log.warn("Retry {} failed for email [{}]: {}", currentAttempts + 1, delivery.getRecipientEmail(), e.getMessage());
                if (delivery.getAttemptCount() >= notificationProperties.getMaxEmailRetries()) {
                    delivery.setStatus(EmailDeliveryStatus.FAILED);
                } else {
                    delivery.setNextRetryAt(Instant.now().plusSeconds(notificationProperties.getEmailRetryDelaySeconds()));
                }
                delivery.setErrorMessage(e.getMessage());
            }

            emailDeliveryRepository.save(delivery);
        }

        return retriedCount;
    }
}
