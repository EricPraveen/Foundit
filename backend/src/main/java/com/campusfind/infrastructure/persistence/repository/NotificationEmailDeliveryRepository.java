package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.notification.EmailDeliveryStatus;
import com.campusfind.infrastructure.persistence.entity.NotificationEmailDeliveryEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationEmailDeliveryRepository extends JpaRepository<NotificationEmailDeliveryEntity, UUID> {

    List<NotificationEmailDeliveryEntity> findByStatusAndNextRetryAtLessThanEqual(
            EmailDeliveryStatus status, Instant now);

    List<NotificationEmailDeliveryEntity> findByNotificationId(UUID notificationId);
}
