package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface FoundItemRepository extends JpaRepository<FoundItemEntity, UUID>, JpaSpecificationExecutor<FoundItemEntity> {

    Page<FoundItemEntity> findByFinderIdOrderByCreatedAtDesc(UUID finderId, Pageable pageable);

    Page<FoundItemEntity> findByDesignatedSecurityOfficeIdAndHandoverStatusOrderByCreatedAtAsc(
            UUID officeId, HandoverStatus handoverStatus, Pageable pageable);

    List<FoundItemEntity> findByHandoverStatusAndCreatedAtBeforeOrderByCreatedAtAsc(
            HandoverStatus handoverStatus, Instant cutoff);

    Page<FoundItemEntity> findByAvailabilityStatusAndHandoverStatus(
            ItemAvailabilityStatus availabilityStatus, HandoverStatus handoverStatus, Pageable pageable);
}
