package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.LostReportAuditLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LostReportAuditLogRepository extends JpaRepository<LostReportAuditLogEntity, UUID> {

    List<LostReportAuditLogEntity> findByLostReportIdOrderByCreatedAtDesc(UUID lostReportId);
}
