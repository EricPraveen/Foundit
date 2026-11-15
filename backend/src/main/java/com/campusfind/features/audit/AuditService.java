package com.campusfind.features.audit;

import com.campusfind.features.audit.dto.AuditLogResponse;
import com.campusfind.infrastructure.persistence.entity.AuditLogEntity;
import com.campusfind.infrastructure.persistence.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private static final Pattern SENSITIVE_PATTERN = Pattern.compile(
            "(?i)(password|token|secret|authorization|jwt|hash|bearer)\\s*[:=]\\s*['\"]?[^'\"\\s,;]+['\"]?");

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLogEntity record(
            UUID actorUserId,
            String actorEmail,
            String actorRole,
            String action,
            String entityType,
            String entityId,
            String outcome,
            String metadata,
            String ipAddress) {
        try {
            String sanitizedMeta = sanitizeMetadata(metadata);
            AuditLogEntity entry = new AuditLogEntity(
                    actorUserId,
                    actorEmail,
                    actorRole != null ? actorRole : "ANONYMOUS",
                    action,
                    entityType,
                    entityId,
                    outcome != null ? outcome : "SUCCESS",
                    sanitizedMeta,
                    ipAddress);
            return auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log entry: action={}, entityType={}, entityId={}", action, entityType, entityId, e);
            return null;
        }
    }

    public void recordSuccess(
            UUID actorUserId,
            String actorEmail,
            String actorRole,
            String action,
            String entityType,
            String entityId,
            String metadata) {
        record(actorUserId, actorEmail, actorRole, action, entityType, entityId, "SUCCESS", metadata, null);
    }

    public void recordFailure(
            UUID actorUserId,
            String actorEmail,
            String actorRole,
            String action,
            String entityType,
            String entityId,
            String metadata) {
        record(actorUserId, actorEmail, actorRole, action, entityType, entityId, "FAILURE", metadata, null);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAuditLogs(
            UUID actorUserId,
            String action,
            String entityType,
            String entityId,
            String outcome,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Specification<AuditLogEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (actorUserId != null) {
                predicates.add(cb.equal(root.get("actorUserId"), actorUserId));
            }
            if (action != null && !action.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("action")), action.trim().toUpperCase()));
            }
            if (entityType != null && !entityType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("entityType")), entityType.trim().toUpperCase()));
            }
            if (entityId != null && !entityId.isBlank()) {
                predicates.add(cb.equal(root.get("entityId"), entityId.trim()));
            }
            if (outcome != null && !outcome.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("outcome")), outcome.trim().toUpperCase()));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return auditLogRepository.findAll(spec, pageable).map(AuditLogResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AuditLogResponse getAuditLogById(UUID id) {
        AuditLogEntity entity = auditLogRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Audit record not found: " + id));
        return AuditLogResponse.fromEntity(entity);
    }

    private String sanitizeMetadata(String metadata) {
        if (metadata == null) {
            return null;
        }
        return SENSITIVE_PATTERN.matcher(metadata).replaceAll("$1=[REDACTED]");
    }
}
