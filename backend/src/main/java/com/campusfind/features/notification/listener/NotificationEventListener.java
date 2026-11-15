package com.campusfind.features.notification.listener;

import com.campusfind.common.event.ClaimApprovedEvent;
import com.campusfind.common.event.ClaimRejectedEvent;
import com.campusfind.common.event.ClaimSubmittedEvent;
import com.campusfind.common.event.CollectionConfirmedEvent;
import com.campusfind.common.event.FoundItemHandoverConfirmedEvent;
import com.campusfind.common.event.FoundItemReportedEvent;
import com.campusfind.domain.notification.NotificationEntityType;
import com.campusfind.domain.notification.NotificationType;
import com.campusfind.features.notification.NotificationService;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.NotificationEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;

    public NotificationEventListener(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onFoundItemReported(FoundItemReportedEvent event) {
        FoundItemEntity item = event.item();
        UserEntity finder = item.getFinder();

        NotificationEntity notif = notificationService.createInAppNotification(
                finder,
                NotificationType.FOUND_ITEM_REPORTED,
                "Found Item Report Submitted",
                "Thank you for reporting '" + item.getTitle() + "'. Please bring the item to the Central Security Desk to complete physical handover.",
                NotificationEntityType.FOUND_ITEM,
                item.getId()
        );

        notificationService.queueEmailNotification(
                notif,
                finder.getEmail(),
                "CampusFind: Found Item Report Submitted - " + item.getTitle(),
                "Hello " + finder.getFullName() + ",\n\nYour found item report for '" + item.getTitle() +
                        "' has been registered. Please physically hand over the item to the Central Security Office to make it available for student claims."
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onFoundItemHandoverConfirmed(FoundItemHandoverConfirmedEvent event) {
        FoundItemEntity item = event.item();
        UserEntity finder = item.getFinder();

        NotificationEntity notif = notificationService.createInAppNotification(
                finder,
                NotificationType.FOUND_ITEM_HANDOVER_CONFIRMED,
                "Found Item Handover Confirmed",
                "Your found item '" + item.getTitle() + "' has been physically received by the Security Office and is now listed as AVAILABLE for student claiming.",
                NotificationEntityType.FOUND_ITEM,
                item.getId()
        );

        notificationService.queueEmailNotification(
                notif,
                finder.getEmail(),
                "CampusFind: Handover Confirmed - " + item.getTitle(),
                "Hello " + finder.getFullName() + ",\n\nThe Security Office has confirmed physical custody of '" +
                        item.getTitle() + "'. The item is now listed as AVAILABLE on CampusFind."
        );

        if (event.pointsAwarded() > 0) {
            notificationService.createInAppNotification(
                    finder,
                    NotificationType.REPUTATION_AWARDED,
                    "Reputation Points Awarded",
                    "You earned " + event.pointsAwarded() + " reputation points for handing over '" + item.getTitle() + "'.",
                    NotificationEntityType.REPUTATION,
                    item.getId()
            );
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onClaimSubmitted(ClaimSubmittedEvent event) {
        ClaimEntity claim = event.claim();
        UserEntity claimant = claim.getClaimant();

        NotificationEntity notif = notificationService.createInAppNotification(
                claimant,
                NotificationType.CLAIM_SUBMITTED,
                "Claim Submitted",
                "Your ownership claim for item '" + claim.getFoundItem().getTitle() + "' has been submitted and is awaiting Security Officer review.",
                NotificationEntityType.CLAIM,
                claim.getId()
        );

        notificationService.queueEmailNotification(
                notif,
                claimant.getEmail(),
                "CampusFind: Ownership Claim Received",
                "Hello " + claimant.getFullName() + ",\n\nYour ownership claim for '" + claim.getFoundItem().getTitle() +
                        "' was received. A Security Officer will review your submitted evidence."
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onClaimApproved(ClaimApprovedEvent event) {
        ClaimEntity claim = event.claim();
        UserEntity claimant = claim.getClaimant();

        NotificationEntity notif = notificationService.createInAppNotification(
                claimant,
                NotificationType.CLAIM_APPROVED,
                "Claim Approved - Ready for Collection",
                "Your ownership claim for '" + claim.getFoundItem().getTitle() + "' has been approved! Please visit the Central Security Office with your physical Student ID to collect your item.",
                NotificationEntityType.CLAIM,
                claim.getId()
        );

        notificationService.queueEmailNotification(
                notif,
                claimant.getEmail(),
                "CampusFind: Claim Approved - Collect Your Item",
                "Hello " + claimant.getFullName() + ",\n\nYour claim for '" + claim.getFoundItem().getTitle() +
                        "' has been approved! Please visit the Central Security Office during operating hours with your physical Student ID card to collect your belongings."
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onClaimRejected(ClaimRejectedEvent event) {
        ClaimEntity claim = event.claim();
        UserEntity claimant = claim.getClaimant();

        NotificationEntity notif = notificationService.createInAppNotification(
                claimant,
                NotificationType.CLAIM_REJECTED,
                "Claim Not Approved",
                "Your claim for '" + claim.getFoundItem().getTitle() + "' was not approved. Reason: " + event.rejectionReason() + ". You may submit a new claim with updated evidence.",
                NotificationEntityType.CLAIM,
                claim.getId()
        );

        notificationService.queueEmailNotification(
                notif,
                claimant.getEmail(),
                "CampusFind: Claim Update",
                "Hello " + claimant.getFullName() + ",\n\nYour claim for '" + claim.getFoundItem().getTitle() +
                        "' could not be approved at this time. Reason: " + event.rejectionReason() +
                        "\n\nYou may submit a new claim with additional ownership evidence."
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCollectionConfirmed(CollectionConfirmedEvent event) {
        ClaimEntity claim = event.claim();
        FoundItemEntity item = event.item();
        UserEntity claimant = claim.getClaimant();
        UserEntity finder = item.getFinder();

        // 1. Notify claimant
        NotificationEntity notifClaimant = notificationService.createInAppNotification(
                claimant,
                NotificationType.COLLECTION_CONFIRMED,
                "Item Collected Successfully",
                "You have successfully collected '" + item.getTitle() + "' from the Central Security Office.",
                NotificationEntityType.CLAIM,
                claim.getId()
        );

        notificationService.queueEmailNotification(
                notifClaimant,
                claimant.getEmail(),
                "CampusFind: Collection Confirmed",
                "Hello " + claimant.getFullName() + ",\n\nPhysical collection of '" + item.getTitle() +
                        "' has been confirmed by the Security Office."
        );

        // 2. Notify finder
        if (!finder.getId().equals(claimant.getId())) {
            notificationService.createInAppNotification(
                    finder,
                    NotificationType.COLLECTION_CONFIRMED,
                    "Found Item Collected by Owner",
                    "The item you found ('" + item.getTitle() + "') was physically collected by its verified rightful owner.",
                    NotificationEntityType.FOUND_ITEM,
                    item.getId()
            );
        }

        // 3. Notify lost report owner if linked
        LostReportEntity lostReport = event.linkedLostReport();
        if (lostReport != null) {
            notificationService.createInAppNotification(
                    lostReport.getStudent(),
                    NotificationType.LOST_REPORT_RECOVERED,
                    "Lost Report Marked as Recovered",
                    "Your lost report '" + lostReport.getTitle() + "' has been marked as RECOVERED following physical collection.",
                    NotificationEntityType.LOST_REPORT,
                    lostReport.getId()
            );
        }

        // 4. Points awarded to claimant (if configured)
        if (event.pointsAwarded() > 0) {
            notificationService.createInAppNotification(
                    claimant,
                    NotificationType.REPUTATION_AWARDED,
                    "Reputation Points Awarded",
                    "You earned " + event.pointsAwarded() + " reputation points for completing collection of '" + item.getTitle() + "'.",
                    NotificationEntityType.REPUTATION,
                    claim.getId()
            );
        }
    }
}
