package com.campusfind.infrastructure.persistence.entity;

import com.campusfind.domain.claim.ClaimStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "claims")
public class ClaimEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "found_item_id", nullable = false)
    private FoundItemEntity foundItem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "claimant_id", nullable = false)
    private UserEntity claimant;

    @Column(name = "index_number", length = 50, nullable = false)
    private String indexNumber;

    @Column(name = "ownership_description", columnDefinition = "TEXT", nullable = false)
    private String ownershipDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private ClaimStatus status = ClaimStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewing_officer_id")
    private UserEntity reviewingOfficer;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "claim", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<ClaimEvidenceEntity> evidenceList = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public ClaimEntity() {}

    public ClaimEntity(
            FoundItemEntity foundItem,
            UserEntity claimant,
            String indexNumber,
            String ownershipDescription) {
        this.id = UUID.randomUUID();
        this.foundItem = foundItem;
        this.claimant = claimant;
        this.indexNumber = indexNumber;
        this.ownershipDescription = ownershipDescription;
        this.status = ClaimStatus.PENDING;
        this.submittedAt = Instant.now();
        this.version = 0L;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        if (this.submittedAt == null) {
            this.submittedAt = now;
        }
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = Instant.now();
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

    public UserEntity getClaimant() {
        return claimant;
    }

    public void setClaimant(UserEntity claimant) {
        this.claimant = claimant;
    }

    public String getIndexNumber() {
        return indexNumber;
    }

    public void setIndexNumber(String indexNumber) {
        this.indexNumber = indexNumber;
    }

    public String getOwnershipDescription() {
        return ownershipDescription;
    }

    public void setOwnershipDescription(String ownershipDescription) {
        this.ownershipDescription = ownershipDescription;
    }

    public ClaimStatus getStatus() {
        return status;
    }

    public void setStatus(ClaimStatus status) {
        this.status = status;
    }

    public UserEntity getReviewingOfficer() {
        return reviewingOfficer;
    }

    public void setReviewingOfficer(UserEntity reviewingOfficer) {
        this.reviewingOfficer = reviewingOfficer;
    }

    public String getReviewNotes() {
        return reviewNotes;
    }

    public void setReviewNotes(String reviewNotes) {
        this.reviewNotes = reviewNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public List<ClaimEvidenceEntity> getEvidenceList() {
        return evidenceList;
    }

    public void setEvidenceList(List<ClaimEvidenceEntity> evidenceList) {
        this.evidenceList = evidenceList;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
