package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.FoundItemImageEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FoundItemImageRepository extends JpaRepository<FoundItemImageEntity, UUID> {

    List<FoundItemImageEntity> findByFoundItemId(UUID foundItemId);

    Optional<FoundItemImageEntity> findByIdAndFoundItemId(UUID id, UUID foundItemId);
}
