package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityOfficerProfileRepository extends JpaRepository<SecurityOfficerProfileEntity, UUID> {

    Optional<SecurityOfficerProfileEntity> findByUserId(UUID userId);

    List<SecurityOfficerProfileEntity> findAllBySecurityOfficeId(UUID securityOfficeId);
}
