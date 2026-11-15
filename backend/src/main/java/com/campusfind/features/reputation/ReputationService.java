package com.campusfind.features.reputation;

import com.campusfind.domain.reputation.ReputationSourceType;
import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.features.reputation.dto.ReputationBalanceResponse;
import com.campusfind.features.reputation.dto.ReputationTransactionResponse;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.ReputationTransactionEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryReputationRuleRepository;
import com.campusfind.infrastructure.persistence.repository.ReputationTransactionRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReputationService {

    private static final Logger log = LoggerFactory.getLogger(ReputationService.class);

    private final ReputationTransactionRepository reputationTransactionRepository;
    private final CategoryReputationRuleRepository categoryReputationRuleRepository;
    private final UserRepository userRepository;
    private final ReputationProperties reputationProperties;

    public ReputationService(
            ReputationTransactionRepository reputationTransactionRepository,
            CategoryReputationRuleRepository categoryReputationRuleRepository,
            UserRepository userRepository,
            ReputationProperties reputationProperties) {
        this.reputationTransactionRepository = reputationTransactionRepository;
        this.categoryReputationRuleRepository = categoryReputationRuleRepository;
        this.userRepository = userRepository;
        this.reputationProperties = reputationProperties;
    }

    @Transactional
    public int awardHandoverPoints(FoundItemEntity item, UserEntity officer) {
        if (!reputationProperties.isEnabled()) {
            return 0;
        }

        String idempotencyKey = "FOUND_ITEM_HANDOVER:" + item.getId();
        if (reputationTransactionRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.info("Handover points already awarded for item: {}", item.getId());
            return 0;
        }

        int points = resolvePoints(item.getCategory(), ReputationTransactionType.FOUND_ITEM_HANDOVER, reputationProperties.getDefaultHandoverPoints());
        if (points <= 0) {
            return 0;
        }

        ReputationTransactionEntity tx = new ReputationTransactionEntity(
                item.getFinder(),
                points,
                ReputationTransactionType.FOUND_ITEM_HANDOVER,
                ReputationSourceType.FOUND_ITEM,
                item.getId(),
                idempotencyKey,
                "Points awarded for handing over found item: " + item.getTitle(),
                officer
        );

        try {
            reputationTransactionRepository.save(tx);
            log.info("Awarded {} handover points to user {} for item {}", points, item.getFinder().getId(), item.getId());
            return points;
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent duplicate handover reward prevented for key: {}", idempotencyKey);
            return 0;
        }
    }

    @Transactional
    public int awardCollectionPoints(ClaimEntity claim, FoundItemEntity item, UserEntity officer) {
        if (!reputationProperties.isEnabled()) {
            return 0;
        }

        String idempotencyKey = "ITEM_COLLECTION:" + claim.getId();
        if (reputationTransactionRepository.existsByIdempotencyKey(idempotencyKey)) {
            log.info("Collection points already awarded for claim: {}", claim.getId());
            return 0;
        }

        int points = resolvePoints(item.getCategory(), ReputationTransactionType.ITEM_COLLECTION, reputationProperties.getDefaultCollectionPoints());
        if (points <= 0) {
            return 0;
        }

        ReputationTransactionEntity tx = new ReputationTransactionEntity(
                claim.getClaimant(),
                points,
                ReputationTransactionType.ITEM_COLLECTION,
                ReputationSourceType.CLAIM,
                claim.getId(),
                idempotencyKey,
                "Points awarded for successful item collection: " + item.getTitle(),
                officer
        );

        try {
            reputationTransactionRepository.save(tx);
            log.info("Awarded {} collection points to claimant {} for claim {}", points, claim.getClaimant().getId(), claim.getId());
            return points;
        } catch (DataIntegrityViolationException e) {
            log.warn("Concurrent duplicate collection reward prevented for key: {}", idempotencyKey);
            return 0;
        }
    }

    @Transactional(readOnly = true)
    public ReputationBalanceResponse getBalance(String userEmail) {
        UserEntity user = getUserByEmail(userEmail);
        int currentBalance = reputationTransactionRepository.sumPointsByUserId(user.getId());
        int totalEarned = reputationTransactionRepository.sumEarnedPointsByUserId(user.getId());
        long totalTransactions = reputationTransactionRepository.countByUserId(user.getId());

        return new ReputationBalanceResponse(user.getId(), currentBalance, totalEarned, totalTransactions);
    }

    @Transactional(readOnly = true)
    public Page<ReputationTransactionResponse> getHistory(String userEmail, Pageable pageable) {
        UserEntity user = getUserByEmail(userEmail);
        return reputationTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::mapToResponse);
    }

    private int resolvePoints(CategoryEntity category, ReputationTransactionType type, int fallbackDefault) {
        if (category != null && category.getId() != null) {
            Optional<CategoryReputationRuleEntity> ruleOpt = categoryReputationRuleRepository
                    .findByCategoryIdAndTransactionTypeAndActiveTrue(category.getId(), type);
            if (ruleOpt.isPresent()) {
                return ruleOpt.get().getPoints();
            }
        }
        return fallbackDefault;
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }

    private ReputationTransactionResponse mapToResponse(ReputationTransactionEntity entity) {
        return new ReputationTransactionResponse(
                entity.getId(),
                entity.getTransactionType(),
                entity.getPoints(),
                entity.getDescription(),
                entity.getCreatedAt()
        );
    }
}
