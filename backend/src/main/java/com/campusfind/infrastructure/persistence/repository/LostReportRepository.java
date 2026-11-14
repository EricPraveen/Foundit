package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LostReportRepository extends JpaRepository<LostReportEntity, UUID>, JpaSpecificationExecutor<LostReportEntity> {

    Page<LostReportEntity> findByStudentIdOrderByCreatedAtDesc(UUID studentId, Pageable pageable);

    Optional<LostReportEntity> findByIdAndStudentId(UUID id, UUID studentId);

    Page<LostReportEntity> findByDesignatedSecurityOfficeIdAndStatusOrderByCreatedAtDesc(
            UUID officeId, LostReportStatus status, Pageable pageable);
}
