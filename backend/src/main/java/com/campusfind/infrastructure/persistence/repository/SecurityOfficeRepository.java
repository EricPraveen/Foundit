package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityOfficeRepository extends JpaRepository<SecurityOfficeEntity, UUID> {

    Optional<SecurityOfficeEntity> findFirstByActiveTrue();
}
