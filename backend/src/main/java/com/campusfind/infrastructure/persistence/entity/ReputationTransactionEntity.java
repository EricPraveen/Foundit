package com.campusfind.infrastructure.persistence.entity;

import com.campusfind.domain.reputation.ReputationSourceType;
import com.campusfind.domain.reputation.ReputationTransactionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reputation_transactions")
public class ReputationTransactionEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "points", nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 50, nullable = false)
    private ReputationTransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", length = 50, nullable = false)
    private ReputationSourceType sourceType;

    @Column(name = "source_id", nullable = false)
    private UUID sourceId;

    @Column(name = "idempotency_key", length = 150, nullable = false, unique = true)
    private String idempotencyKey;

    @Column(name = "description", length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id")
    private UserEntity createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ReputationTransactionEntity() {}

    public ReputationTransactionEntity(
            UserEntity user,
            int points,
            ReputationTransactionType transactionType,
            ReputationSourceType sourceType,
            UUID sourceId,
            String idempotencyKey,
            String description,
            UserEntity createdBy) {
        this.id = UUID.randomUUID();
        this.user = user;
        this.points = points;
        this.transactionType = transactionType;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
        this.idempotencyKey = idempotencyKey;
        this.description = description;
        this.createdBy = createdBy;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public ReputationTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(ReputationTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public ReputationSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(ReputationSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public UUID getSourceId() {
        return sourceId;
    }

    public void setSourceId(UUID sourceId) {
        this.sourceId = sourceId;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UserEntity getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserEntity createdBy) {
        this.createdBy = createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
