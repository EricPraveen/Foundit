package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface FoundItemRepository extends JpaRepository<FoundItemEntity, UUID>, JpaSpecificationExecutor<FoundItemEntity> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FoundItemEntity f WHERE f.id = :id")
    Optional<FoundItemEntity> findByIdForUpdate(@Param("id") UUID id);

    Page<FoundItemEntity> findByFinderIdOrderByCreatedAtDesc(UUID finderId, Pageable pageable);

    Page<FoundItemEntity> findByDesignatedSecurityOfficeIdAndHandoverStatusOrderByCreatedAtAsc(
            UUID officeId, HandoverStatus handoverStatus, Pageable pageable);

    List<FoundItemEntity> findByHandoverStatusAndCreatedAtBeforeOrderByCreatedAtAsc(
            HandoverStatus handoverStatus, Instant cutoff);

    List<FoundItemEntity> findByHandoverStatus(HandoverStatus handoverStatus);

    List<FoundItemEntity> findByAvailabilityStatusAndHandoverConfirmedAtBefore(
            ItemAvailabilityStatus availabilityStatus, Instant cutoff);

    Page<FoundItemEntity> findByAvailabilityStatusAndHandoverStatus(
            ItemAvailabilityStatus availabilityStatus, HandoverStatus handoverStatus, Pageable pageable);
}
