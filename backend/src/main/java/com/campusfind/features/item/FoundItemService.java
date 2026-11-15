package com.campusfind.features.item;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.item.HandoverStatus;
import com.campusfind.domain.item.ItemAvailabilityStatus;
import com.campusfind.features.item.dto.ConfirmHandoverRequest;
import com.campusfind.features.item.dto.CreateFoundItemRequest;
import com.campusfind.features.item.dto.FoundItemImageResponse;
import com.campusfind.features.item.dto.FoundItemResponse;
import com.campusfind.features.item.dto.FoundItemSummaryResponse;
import com.campusfind.features.item.dto.HandoverLogResponse;
import com.campusfind.features.item.dto.UpdateFoundItemRequest;
import com.campusfind.features.notification.event.FoundItemHandoverConfirmedEvent;
import com.campusfind.features.notification.event.FoundItemReportedEvent;
import com.campusfind.features.reputation.ReputationService;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemHandoverLogEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemImageEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemHandoverLogRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemImageRepository;
import com.campusfind.infrastructure.persistence.repository.FoundItemRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.storage.StorageService;
import com.campusfind.infrastructure.storage.StoredFile;
import jakarta.persistence.criteria.Predicate;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FoundItemService {

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final int MAX_IMAGES_PER_ITEM = 5;

    private final FoundItemRepository foundItemRepository;
    private final FoundItemImageRepository foundItemImageRepository;
    private final FoundItemHandoverLogRepository foundItemHandoverLogRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final SecurityOfficeRepository securityOfficeRepository;
    private final SecurityOfficerProfileRepository securityOfficerProfileRepository;
    private final StorageService storageService;
    private final ReputationService reputationService;
    private final ApplicationEventPublisher eventPublisher;

    @Value("${app.storage.bucket:found-items}")
    private String storageBucket;

    public FoundItemService(
            FoundItemRepository foundItemRepository,
            FoundItemImageRepository foundItemImageRepository,
            FoundItemHandoverLogRepository foundItemHandoverLogRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            LocationRepository locationRepository,
            SecurityOfficeRepository securityOfficeRepository,
            SecurityOfficerProfileRepository securityOfficerProfileRepository,
            StorageService storageService,
            ReputationService reputationService,
            ApplicationEventPublisher eventPublisher) {
        this.foundItemRepository = foundItemRepository;
        this.foundItemImageRepository = foundItemImageRepository;
        this.foundItemHandoverLogRepository = foundItemHandoverLogRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.locationRepository = locationRepository;
        this.securityOfficeRepository = securityOfficeRepository;
        this.securityOfficerProfileRepository = securityOfficerProfileRepository;
        this.storageService = storageService;
        this.reputationService = reputationService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public FoundItemResponse reportFoundItem(String userEmail, CreateFoundItemRequest request) {
        UserEntity finder = getUserByEmail(userEmail);

        CategoryEntity category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found: " + request.categoryId()));
        if (!category.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot report item in an inactive category");
        }

        LocationEntity location = locationRepository.findById(request.locationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found: " + request.locationId()));
        if (!location.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot report item in an inactive location");
        }

        SecurityOfficeEntity office = securityOfficeRepository.findById(request.designatedSecurityOfficeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Security Office not found: " + request.designatedSecurityOfficeId()));
        if (!office.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot designate an inactive security office");
        }

        FoundItemEntity entity = new FoundItemEntity(
                request.title(),
                request.description(),
                category,
                location,
                request.specificLocation(),
                request.foundAt(),
                finder,
                office
        );

        FoundItemEntity saved = foundItemRepository.save(entity);
        eventPublisher.publishEvent(new FoundItemReportedEvent(saved));
        return mapToResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public Page<FoundItemSummaryResponse> getAvailableFoundItems(
            String query,
            UUID categoryId,
            UUID locationId,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        Specification<FoundItemEntity> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Strictly filter to AVAILABLE items that have been verified and confirmed by officers
            predicates.add(cb.equal(root.get("handoverStatus"), HandoverStatus.CONFIRMED));
            predicates.add(cb.equal(root.get("availabilityStatus"), ItemAvailabilityStatus.AVAILABLE));

            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleLike, descLike));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("foundAt"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("foundAt"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return foundItemRepository.findAll(spec, pageable).map(this::mapToSummaryResponse);
    }

    @Transactional(readOnly = true)
    public FoundItemResponse getFoundItemById(UUID id, String userEmail) {
        FoundItemEntity item = foundItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + id));

        boolean isFinderOrOfficer = false;
        if (userEmail != null) {
            UserEntity user = userRepository.findByEmail(userEmail).orElse(null);
            if (user != null) {
                boolean isFinder = item.getFinder().getId().equals(user.getId());
                boolean isOfficerOrAdmin = user.getRole() == UserRole.SECURITY_OFFICER || user.getRole() == UserRole.SUPER_ADMIN;
                isFinderOrOfficer = isFinder || isOfficerOrAdmin;
            }
        }

        // If not available, only finder or security officers can view it
        if (item.getAvailabilityStatus() != ItemAvailabilityStatus.AVAILABLE && !isFinderOrOfficer) {
            if (userEmail == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to access pending handover report");
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Item is not available for public view");
        }

        return mapToResponse(item, isFinderOrOfficer);
    }

    @Transactional(readOnly = true)
    public Page<FoundItemResponse> getMyFoundReports(String userEmail, Pageable pageable) {
        UserEntity finder = getUserByEmail(userEmail);
        return foundItemRepository.findByFinderIdOrderByCreatedAtDesc(finder.getId(), pageable)
                .map(item -> mapToResponse(item, true));
    }

    @Transactional
    public FoundItemResponse updateFoundItem(UUID id, String userEmail, UpdateFoundItemRequest request) {
        FoundItemEntity item = foundItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + id));

        UserEntity user = getUserByEmail(userEmail);
        if (!item.getFinder().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You can only edit your own found item report");
        }

        if (item.getHandoverStatus() != HandoverStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot modify a report after handover confirmation or cancellation");
        }

        if (request.title() != null && !request.title().isBlank()) {
            item.setTitle(request.title().trim());
        }
        if (request.description() != null && !request.description().isBlank()) {
            item.setDescription(request.description().trim());
        }
        if (request.categoryId() != null) {
            CategoryEntity category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found: " + request.categoryId()));
            item.setCategory(category);
        }
        if (request.locationId() != null) {
            LocationEntity location = locationRepository.findById(request.locationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found: " + request.locationId()));
            item.setLocation(location);
        }
        if (request.specificLocation() != null) {
            item.setSpecificLocation(request.specificLocation().trim());
        }

        FoundItemEntity updated = foundItemRepository.save(item);
        return mapToResponse(updated, true);
    }

    @Transactional
    public FoundItemResponse cancelFoundReport(UUID id, String userEmail) {
        FoundItemEntity item = foundItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + id));

        UserEntity user = getUserByEmail(userEmail);
        if (!item.getFinder().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You can only cancel your own report");
        }

        if (item.getHandoverStatus() != HandoverStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel report. Current status: " + item.getHandoverStatus());
        }

        item.setHandoverStatus(HandoverStatus.CANCELLED);
        item.setAvailabilityStatus(ItemAvailabilityStatus.UNAVAILABLE);

        FoundItemEntity saved = foundItemRepository.save(item);
        return mapToResponse(saved, true);
    }

    @Transactional
    public FoundItemImageResponse uploadImage(UUID foundItemId, String userEmail, MultipartFile file) {
        FoundItemEntity item = foundItemRepository.findById(foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + foundItemId));

        UserEntity user = getUserByEmail(userEmail);
        boolean isFinder = item.getFinder().getId().equals(user.getId());
        boolean isOfficerOrAdmin = user.getRole() == UserRole.SECURITY_OFFICER || user.getRole() == UserRole.SUPER_ADMIN;

        if (!isFinder && !isOfficerOrAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot upload images to this item report");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must not be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image format. Allowed: JPEG, PNG, WebP");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file size exceeds maximum limit of 5 MB");
        }

        if (item.getImages().size() >= MAX_IMAGES_PER_ITEM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum of " + MAX_IMAGES_PER_ITEM + " images permitted per found item");
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String storagePath = "items/" + foundItemId + "/" + UUID.randomUUID() + extension;

        try {
            StoredFile storedFile = storageService.upload(storageBucket, storagePath, file.getBytes(), contentType);

            FoundItemImageEntity imageEntity = new FoundItemImageEntity(
                    item,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "image" + extension,
                    storedFile.storagePath(),
                    storedFile.publicUrl(),
                    contentType,
                    file.getSize()
            );

            FoundItemImageEntity saved = foundItemImageRepository.save(imageEntity);

            return mapToImageResponse(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read image content", e);
        }
    }

    @Transactional
    public void deleteImage(UUID foundItemId, UUID imageId, String userEmail) {
        FoundItemEntity item = foundItemRepository.findById(foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + foundItemId));

        UserEntity user = getUserByEmail(userEmail);
        boolean isFinder = item.getFinder().getId().equals(user.getId());
        boolean isOfficerOrAdmin = user.getRole() == UserRole.SECURITY_OFFICER || user.getRole() == UserRole.SUPER_ADMIN;

        if (!isFinder && !isOfficerOrAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot delete image from this item report");
        }

        FoundItemImageEntity image = foundItemImageRepository.findByIdAndFoundItemId(imageId, foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found for item: " + imageId));

        storageService.delete(storageBucket, image.getStoragePath());
        foundItemImageRepository.delete(image);
    }

    @Transactional
    public FoundItemResponse confirmHandover(UUID foundItemId, String officerEmail, ConfirmHandoverRequest request) {
        FoundItemEntity item = foundItemRepository.findById(foundItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Found item not found: " + foundItemId));

        UserEntity officer = getUserByEmail(officerEmail);
        if (officer.getRole() != UserRole.SECURITY_OFFICER && officer.getRole() != UserRole.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only security officers or administrators can confirm handovers");
        }

        // If security officer, verify assignment to designated security office
        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officer.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured"));
            
            if (!profile.getSecurityOffice().getId().equals(item.getDesignatedSecurityOffice().getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this item");
            }
        }

        if (item.getHandoverStatus() != HandoverStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Found item is not pending handover. Current status: " + item.getHandoverStatus());
        }

        Instant now = Instant.now();
        item.setHandoverStatus(HandoverStatus.CONFIRMED);
        item.setAvailabilityStatus(ItemAvailabilityStatus.AVAILABLE);
        item.setReceivingOfficer(officer);
        item.setHandoverConfirmedAt(now);

        String notes = (request != null && request.officerNotes() != null) ? request.officerNotes().trim() : null;
        item.setOfficerNotes(notes);

        FoundItemEntity saved = foundItemRepository.save(item);

        // Record immutable audit trail log
        FoundItemHandoverLogEntity logEntity = new FoundItemHandoverLogEntity(
                saved,
                item.getFinder().getId(),
                officer.getId(),
                item.getDesignatedSecurityOffice().getId(),
                now,
                notes
        );
        foundItemHandoverLogRepository.save(logEntity);

        // Award finder reputation points for confirmed physical handover
        int points = reputationService.awardHandoverPoints(saved, officer);

        // Publish handover event
        eventPublisher.publishEvent(new FoundItemHandoverConfirmedEvent(saved, officer, points));

        return mapToResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public Page<FoundItemResponse> getPendingHandoverItems(String officerEmail, Pageable pageable) {
        UserEntity officer = getUserByEmail(officerEmail);

        if (officer.getRole() == UserRole.SUPER_ADMIN) {
            Specification<FoundItemEntity> spec = (root, cq, cb) -> cb.equal(root.get("handoverStatus"), HandoverStatus.PENDING);
            return foundItemRepository.findAll(spec, pageable).map(item -> mapToResponse(item, true));
        }

        SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officer.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured"));

        UUID officeId = profile.getSecurityOffice().getId();
        return foundItemRepository.findByDesignatedSecurityOfficeIdAndHandoverStatusOrderByCreatedAtAsc(
                officeId, HandoverStatus.PENDING, pageable).map(item -> mapToResponse(item, true));
    }

    @Transactional(readOnly = true)
    public List<FoundItemResponse> getOverduePendingHandovers(Duration threshold) {
        Instant cutoff = Instant.now().minus(threshold);
        return foundItemRepository.findByHandoverStatusAndCreatedAtBeforeOrderByCreatedAtAsc(HandoverStatus.PENDING, cutoff)
                .stream()
                .map(item -> mapToResponse(item, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HandoverLogResponse> getHandoverHistory(UUID foundItemId) {
        return foundItemHandoverLogRepository.findByFoundItemIdOrderByHandoverConfirmedAtDesc(foundItemId)
                .stream()
                .map(this::mapToLogResponse)
                .toList();
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
    }

    private FoundItemResponse mapToResponse(FoundItemEntity entity, boolean includeSensitive) {
        List<FoundItemImageResponse> imageResponses = entity.getImages().stream()
                .map(this::mapToImageResponse)
                .toList();

        return new FoundItemResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCategory().getId(),
                entity.getCategory().getName(),
                entity.getLocation().getId(),
                entity.getLocation().getName(),
                entity.getSpecificLocation(),
                entity.getFoundAt(),
                entity.getDesignatedSecurityOffice().getId(),
                entity.getDesignatedSecurityOffice().getName(),
                entity.getHandoverStatus(),
                entity.getAvailabilityStatus(),
                includeSensitive ? entity.getFinder().getId() : null,
                includeSensitive ? entity.getFinder().getFullName() : null,
                entity.getReceivingOfficer() != null ? entity.getReceivingOfficer().getId() : null,
                entity.getReceivingOfficer() != null ? entity.getReceivingOfficer().getFullName() : null,
                entity.getHandoverConfirmedAt(),
                includeSensitive ? entity.getOfficerNotes() : null,
                imageResponses,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private FoundItemSummaryResponse mapToSummaryResponse(FoundItemEntity entity) {
        List<String> imageUrls = entity.getImages().stream()
                .map(FoundItemImageEntity::getPublicUrl)
                .toList();

        return new FoundItemSummaryResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCategory().getId(),
                entity.getCategory().getName(),
                entity.getLocation().getId(),
                entity.getLocation().getName(),
                entity.getSpecificLocation(),
                entity.getFoundAt(),
                entity.getAvailabilityStatus(),
                imageUrls,
                entity.getCreatedAt()
        );
    }

    private FoundItemImageResponse mapToImageResponse(FoundItemImageEntity entity) {
        return new FoundItemImageResponse(
                entity.getId(),
                entity.getOriginalFilename(),
                entity.getStoragePath(),
                entity.getPublicUrl(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    private HandoverLogResponse mapToLogResponse(FoundItemHandoverLogEntity entity) {
        return new HandoverLogResponse(
                entity.getId(),
                entity.getFoundItem().getId(),
                entity.getFinderId(),
                entity.getReceivingOfficerId(),
                entity.getSecurityOfficeId(),
                entity.getHandoverConfirmedAt(),
                entity.getNotes(),
                entity.getCreatedAt()
        );
    }

    private String getExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            return filename.substring(filename.lastIndexOf("."));
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
