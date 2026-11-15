package com.campusfind.features.admin;

import com.campusfind.features.admin.dto.ReputationRuleResponse;
import com.campusfind.features.admin.dto.UpdateReputationRuleRequest;
import com.campusfind.features.audit.AuditService;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryReputationRuleRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminReputationRuleService {

    private final CategoryReputationRuleRepository ruleRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public AdminReputationRuleService(
            CategoryReputationRuleRepository ruleRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.ruleRepository = ruleRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ReputationRuleResponse> getAllRules() {
        return ruleRepository.findAll().stream()
                .map(ReputationRuleResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ReputationRuleResponse updateRule(UUID id, UpdateReputationRuleRequest request, String adminEmail) {
        UserEntity admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Super Admin user not found."));

        CategoryReputationRuleEntity rule = ruleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reputation rule not found: " + id));

        int oldPoints = rule.getPoints();
        boolean oldActive = rule.isActive();

        rule.setPoints(request.points());
        if (request.active() != null) {
            rule.setActive(request.active());
        }

        CategoryReputationRuleEntity updated = ruleRepository.save(rule);

        String categoryName = updated.getCategory() != null ? updated.getCategory().getName() : "Unknown";
        String details = "Reputation rule for category [" + categoryName + "] transactionType [" + updated.getTransactionType() +
                "] updated: points " + oldPoints + " -> " + updated.getPoints() +
                ", active " + oldActive + " -> " + updated.isActive();

        auditService.recordSuccess(
                admin.getId(),
                admin.getEmail(),
                "SUPER_ADMIN",
                "REPUTATION_RULE_UPDATED",
                "REPUTATION_RULE",
                updated.getId().toString(),
                details);

        return ReputationRuleResponse.fromEntity(updated);
    }
}
