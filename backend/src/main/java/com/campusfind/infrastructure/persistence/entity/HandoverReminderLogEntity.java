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

import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "handover_reminder_logs")
public class HandoverReminderLogEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private FoundItemEntity foundItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private UserEntity recipient;

    @Column(name = "cycle_number", nullable = false)
    private int cycleNumber;

    @Column(name = "reminded_at", nullable = false, updatable = false)
    private Instant remindedAt;

    public HandoverReminderLogEntity() {}

    public HandoverReminderLogEntity(
            FoundItemEntity foundItem,
            UserEntity recipient,
            int cycleNumber) {
        this.id = UUID.randomUUID();
        this.foundItem = foundItem;
        this.recipient = recipient;
        this.cycleNumber = cycleNumber;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.remindedAt == null) {
            this.remindedAt = Instant.now();
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

    public UserEntity getRecipient() {
        return recipient;
    }

    public void setRecipient(UserEntity recipient) {
        this.recipient = recipient;
    }

    public int getCycleNumber() {
        return cycleNumber;
    }

    public void setCycleNumber(int cycleNumber) {
        this.cycleNumber = cycleNumber;
    }

    public Instant getRemindedAt() {
        return remindedAt;
    }
}
