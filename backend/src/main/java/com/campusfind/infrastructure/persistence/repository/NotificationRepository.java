package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.NotificationEntity;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, UUID> {

    Page<NotificationEntity> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    java.util.List<NotificationEntity> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId);

    long countByRecipientIdAndReadFalse(UUID recipientId);

    Optional<NotificationEntity> findByIdAndRecipientId(UUID id, UUID recipientId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.read = true, n.readAt = :now WHERE n.recipient.id = :recipientId AND n.read = false")
    int markAllAsReadByRecipientId(@Param("recipientId") UUID recipientId, @Param("now") Instant now);
}
