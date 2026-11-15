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

@Entity
@Table(name = "item_collection_logs")
public class ItemCollectionLogEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claim_id", nullable = false, unique = true)
    private ClaimEntity claim;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false, unique = true)
    private FoundItemEntity foundItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id", nullable = false)
    private UserEntity claimant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "officer_id", nullable = false)
    private UserEntity officer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_office_id", nullable = false)
    private SecurityOfficeEntity securityOffice;

    @Column(name = "collection_status", length = 50, nullable = false)
    private String collectionStatus = "COMPLETED";

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    @Column(name = "officer_notes", columnDefinition = "TEXT")
    private String officerNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ItemCollectionLogEntity() {}

    public ItemCollectionLogEntity(
            ClaimEntity claim,
            FoundItemEntity foundItem,
            UserEntity claimant,
            UserEntity officer,
            SecurityOfficeEntity securityOffice,
            Instant collectedAt,
            String officerNotes) {
        this.id = UUID.randomUUID();
        this.claim = claim;
        this.foundItem = foundItem;
        this.claimant = claimant;
        this.officer = officer;
        this.securityOffice = securityOffice;
        this.collectionStatus = "COMPLETED";
        this.collectedAt = collectedAt;
        this.officerNotes = officerNotes;
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

    public ClaimEntity getClaim() {
        return claim;
    }

    public void setClaim(ClaimEntity claim) {
        this.claim = claim;
    }

    public FoundItemEntity getFoundItem() {
        return foundItem;
    }

    public void setFoundItem(FoundItemEntity foundItem) {
        this.foundItem = foundItem;
    }

    public UserEntity getClaimant() {
        return claimant;
    }

    public void setClaimant(UserEntity claimant) {
        this.claimant = claimant;
    }

    public UserEntity getOfficer() {
        return officer;
    }

    public void setOfficer(UserEntity officer) {
        this.officer = officer;
    }

    public SecurityOfficeEntity getSecurityOffice() {
        return securityOffice;
    }

    public void setSecurityOffice(SecurityOfficeEntity securityOffice) {
        this.securityOffice = securityOffice;
    }

    public String getCollectionStatus() {
        return collectionStatus;
    }

    public void setCollectionStatus(String collectionStatus) {
        this.collectionStatus = collectionStatus;
    }

    public Instant getCollectedAt() {
        return collectedAt;
    }

    public void setCollectedAt(Instant collectedAt) {
        this.collectedAt = collectedAt;
    }

    public String getOfficerNotes() {
        return officerNotes;
    }

    public void setOfficerNotes(String officerNotes) {
        this.officerNotes = officerNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
