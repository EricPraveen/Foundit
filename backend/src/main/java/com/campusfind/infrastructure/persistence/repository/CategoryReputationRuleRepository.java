package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.domain.reputation.ReputationTransactionType;
import com.campusfind.infrastructure.persistence.entity.CategoryReputationRuleEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryReputationRuleRepository extends JpaRepository<CategoryReputationRuleEntity, UUID> {

    Optional<CategoryReputationRuleEntity> findByCategoryIdAndTransactionTypeAndActiveTrue(
            UUID categoryId, ReputationTransactionType transactionType);

    List<CategoryReputationRuleEntity> findByCategoryId(UUID categoryId);
}
