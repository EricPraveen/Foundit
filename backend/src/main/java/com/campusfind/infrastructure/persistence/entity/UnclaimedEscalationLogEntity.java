package com.campusfind.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "unclaimed_escalation_logs")
public class UnclaimedEscalationLogEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private FoundItemEntity foundItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_office_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private SecurityOfficeEntity securityOffice;

    @Column(name = "escalation_reason", length = 255, nullable = false)
    private String escalationReason;

    @Column(name = "escalated_at", nullable = false, updatable = false)
    private Instant escalatedAt;

    public UnclaimedEscalationLogEntity() {}

    public UnclaimedEscalationLogEntity(
            FoundItemEntity foundItem,
            SecurityOfficeEntity securityOffice,
            String escalationReason) {
        this.id = UUID.randomUUID();
        this.foundItem = foundItem;
        this.securityOffice = securityOffice;
        this.escalationReason = escalationReason;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.escalatedAt == null) {
            this.escalatedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public FoundItemEntity getFoundItem() {
        return foundItem;
    }

    public void setFoundItem(FoundItemEntity foundItem) {
        this.foundItem = foundItem;
    }

    public SecurityOfficeEntity getSecurityOffice() {
        return securityOffice;
    }

    public void setSecurityOffice(SecurityOfficeEntity securityOffice) {
        this.securityOffice = securityOffice;
    }

    public String getEscalationReason() {
        return escalationReason;
    }

    public void setEscalationReason(String escalationReason) {
        this.escalationReason = escalationReason;
    }

    public Instant getEscalatedAt() {
        return escalatedAt;
    }
}
