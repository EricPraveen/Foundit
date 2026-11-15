package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.ReputationTransactionEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReputationTransactionRepository extends JpaRepository<ReputationTransactionEntity, UUID> {

    Page<ReputationTransactionEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.points), 0) FROM ReputationTransactionEntity t WHERE t.user.id = :userId")
    int sumPointsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(t.points), 0) FROM ReputationTransactionEntity t WHERE t.user.id = :userId AND t.points > 0")
    int sumEarnedPointsByUserId(@Param("userId") UUID userId);

    long countByUserId(UUID userId);

    boolean existsByIdempotencyKey(String idempotencyKey);

    Optional<ReputationTransactionEntity> findByIdempotencyKey(String idempotencyKey);
}
