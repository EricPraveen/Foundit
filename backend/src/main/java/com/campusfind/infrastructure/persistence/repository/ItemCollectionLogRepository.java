package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.ItemCollectionLogEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemCollectionLogRepository extends JpaRepository<ItemCollectionLogEntity, UUID> {

    Optional<ItemCollectionLogEntity> findByClaimId(UUID claimId);

    Optional<ItemCollectionLogEntity> findByFoundItemId(UUID foundItemId);

    boolean existsByClaimId(UUID claimId);

    boolean existsByFoundItemId(UUID foundItemId);
}
