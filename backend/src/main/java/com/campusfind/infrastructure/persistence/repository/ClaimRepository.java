package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.claim.ClaimStatus;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimRepository extends JpaRepository<ClaimEntity, UUID>, JpaSpecificationExecutor<ClaimEntity> {

    Page<ClaimEntity> findByClaimantIdOrderBySubmittedAtDesc(UUID claimantId, Pageable pageable);

    Optional<ClaimEntity> findByIdAndClaimantId(UUID id, UUID claimantId);

    boolean existsByFoundItemIdAndClaimantIdAndStatusIn(UUID foundItemId, UUID claimantId, Collection<ClaimStatus> statuses);

    boolean existsByFoundItemIdAndStatus(UUID foundItemId, ClaimStatus status);

    List<ClaimEntity> findByFoundItemId(UUID foundItemId);

    List<ClaimEntity> findByFoundItemIdAndStatus(UUID foundItemId, ClaimStatus status);
}
