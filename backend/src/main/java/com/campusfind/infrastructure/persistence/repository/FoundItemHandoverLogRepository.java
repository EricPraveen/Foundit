package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.FoundItemHandoverLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FoundItemHandoverLogRepository extends JpaRepository<FoundItemHandoverLogEntity, UUID> {

    List<FoundItemHandoverLogEntity> findByFoundItemIdOrderByHandoverConfirmedAtDesc(UUID foundItemId);
}
