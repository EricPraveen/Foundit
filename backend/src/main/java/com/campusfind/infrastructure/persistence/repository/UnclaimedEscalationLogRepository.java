package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.UnclaimedEscalationLogEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UnclaimedEscalationLogRepository extends JpaRepository<UnclaimedEscalationLogEntity, UUID> {

    boolean existsByFoundItemId(UUID foundItemId);

    Optional<UnclaimedEscalationLogEntity> findByFoundItemId(UUID foundItemId);
}
