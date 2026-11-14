package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.LostReportImageEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LostReportImageRepository extends JpaRepository<LostReportImageEntity, UUID> {

    List<LostReportImageEntity> findByLostReportId(UUID lostReportId);

    Optional<LostReportImageEntity> findByIdAndLostReportId(UUID id, UUID lostReportId);
}
