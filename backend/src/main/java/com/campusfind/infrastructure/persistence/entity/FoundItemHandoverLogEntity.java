package com.campusfind.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "found_item_handover_logs")
public class FoundItemHandoverLogEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    private FoundItemEntity foundItem;

    @Column(name = "finder_id", nullable = false)
    private UUID finderId;

    @Column(name = "receiving_officer_id", nullable = false)
    private UUID receivingOfficerId;

    @Column(name = "security_office_id", nullable = false)
    private UUID securityOfficeId;

    @Column(name = "handover_confirmed_at", nullable = false)
    private Instant handoverConfirmedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public FoundItemHandoverLogEntity() {}

    public FoundItemHandoverLogEntity(
            FoundItemEntity foundItem,
            UUID finderId,
            UUID receivingOfficerId,
            UUID securityOfficeId,
            Instant handoverConfirmedAt,
            String notes) {
        this.id = UUID.randomUUID();
        this.foundItem = foundItem;
        this.finderId = finderId;
        this.receivingOfficerId = receivingOfficerId;
        this.securityOfficeId = securityOfficeId;
        this.handoverConfirmedAt = handoverConfirmedAt;
        this.notes = notes;
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

    public FoundItemEntity getFoundItem() {
        return foundItem;
    }

    public UUID getFinderId() {
        return finderId;
    }

    public UUID getReceivingOfficerId() {
        return receivingOfficerId;
    }

    public UUID getSecurityOfficeId() {
        return securityOfficeId;
    }

    public Instant getHandoverConfirmedAt() {
        return handoverConfirmedAt;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
