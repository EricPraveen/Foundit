package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.HandoverReminderLogEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HandoverReminderLogRepository extends JpaRepository<HandoverReminderLogEntity, UUID> {

    boolean existsByFoundItemIdAndCycleNumber(UUID foundItemId, int cycleNumber);

    Optional<HandoverReminderLogEntity> findTopByFoundItemIdOrderByRemindedAtDesc(UUID foundItemId);

    List<HandoverReminderLogEntity> findByFoundItemId(UUID foundItemId);
}
