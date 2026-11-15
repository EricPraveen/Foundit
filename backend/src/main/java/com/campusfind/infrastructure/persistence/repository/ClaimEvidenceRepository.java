package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.ClaimEvidenceEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClaimEvidenceRepository extends JpaRepository<ClaimEvidenceEntity, UUID> {

    List<ClaimEvidenceEntity> findByClaimId(UUID claimId);

    Optional<ClaimEvidenceEntity> findByIdAndClaimId(UUID id, UUID claimId);
}
