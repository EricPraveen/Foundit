package com.campusfind.infrastructure.persistence.entity;

import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "found_items")
public class FoundItemEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private LocationEntity location;

    @Column(name = "specific_location", length = 255)
    private String specificLocation;

    @Column(name = "found_at", nullable = false)
    private Instant foundAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "discovered_by_user_id", nullable = false)
    private UserEntity finder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "designated_security_office_id", nullable = false)
    private SecurityOfficeEntity designatedSecurityOffice;

    @Enumerated(EnumType.STRING)
    @Column(name = "handover_status", length = 50, nullable = false)
    private HandoverStatus handoverStatus = HandoverStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", length = 50, nullable = false)
    private ItemAvailabilityStatus availabilityStatus = ItemAvailabilityStatus.UNAVAILABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by_officer_id")
    private UserEntity receivingOfficer;

    @Column(name = "handover_confirmed_at")
    private Instant handoverConfirmedAt;

    @Column(name = "officer_notes", columnDefinition = "TEXT")
    private String officerNotes;

    @OneToMany(mappedBy = "foundItem", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<FoundItemImageEntity> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public FoundItemEntity() {}

    public FoundItemEntity(
            String title,
            String description,
            CategoryEntity category,
            LocationEntity location,
            String specificLocation,
            Instant foundAt,
            UserEntity finder,
            SecurityOfficeEntity designatedSecurityOffice) {
        this.id = UUID.randomUUID();
        this.title = title;
        this.description = description;
        this.category = category;
        this.location = location;
        this.specificLocation = specificLocation;
        this.foundAt = foundAt;
        this.finder = finder;
        this.designatedSecurityOffice = designatedSecurityOffice;
        this.handoverStatus = HandoverStatus.PENDING;
        this.availabilityStatus = ItemAvailabilityStatus.UNAVAILABLE;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        Instant now = Instant.now();
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public CategoryEntity getCategory() {
        return category;
    }

    public void setCategory(CategoryEntity category) {
        this.category = category;
    }

    public LocationEntity getLocation() {
        return location;
    }

    public void setLocation(LocationEntity location) {
        this.location = location;
    }

    public String getSpecificLocation() {
        return specificLocation;
    }

    public void setSpecificLocation(String specificLocation) {
        this.specificLocation = specificLocation;
    }

    public Instant getFoundAt() {
        return foundAt;
    }

    public void setFoundAt(Instant foundAt) {
        this.foundAt = foundAt;
    }

    public UserEntity getFinder() {
        return finder;
    }

    public void setFinder(UserEntity finder) {
        this.finder = finder;
    }

    public SecurityOfficeEntity getDesignatedSecurityOffice() {
        return designatedSecurityOffice;
    }

    public void setDesignatedSecurityOffice(SecurityOfficeEntity designatedSecurityOffice) {
        this.designatedSecurityOffice = designatedSecurityOffice;
    }

    public HandoverStatus getHandoverStatus() {
        return handoverStatus;
    }

    public void setHandoverStatus(HandoverStatus handoverStatus) {
        this.handoverStatus = handoverStatus;
    }

    public ItemAvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(ItemAvailabilityStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public UserEntity getReceivingOfficer() {
        return receivingOfficer;
    }

    public void setReceivingOfficer(UserEntity receivingOfficer) {
        this.receivingOfficer = receivingOfficer;
    }

    public Instant getHandoverConfirmedAt() {
        return handoverConfirmedAt;
    }

    public void setHandoverConfirmedAt(Instant handoverConfirmedAt) {
        this.handoverConfirmedAt = handoverConfirmedAt;
    }

    public String getOfficerNotes() {
        return officerNotes;
    }

    public void setOfficerNotes(String officerNotes) {
        this.officerNotes = officerNotes;
    }

    public List<FoundItemImageEntity> getImages() {
        return images;
    }

    public void addImage(FoundItemImageEntity image) {
        images.add(image);
        image.setFoundItem(this);
    }

    public void removeImage(FoundItemImageEntity image) {
        images.remove(image);
        image.setFoundItem(null);
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
}
