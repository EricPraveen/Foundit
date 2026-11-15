package com.campusfind.features.lostreport;

import com.campusfind.domain.auth.UserRole;
import com.campusfind.domain.lostreport.LostReportStatus;
import com.campusfind.features.audit.AuditService;
import com.campusfind.features.category.dto.CategoryResponse;
import com.campusfind.features.location.dto.LocationResponse;
import com.campusfind.features.lostreport.dto.CancelLostReportRequest;
import com.campusfind.features.lostreport.dto.CreateLostReportRequest;
import com.campusfind.features.lostreport.dto.LostReportAuditLogResponse;
import com.campusfind.features.lostreport.dto.LostReportImageResponse;
import com.campusfind.features.lostreport.dto.LostReportResponse;
import com.campusfind.features.lostreport.dto.ResolveLostReportRequest;
import com.campusfind.features.lostreport.dto.StudentContactInfo;
import com.campusfind.features.lostreport.dto.UpdateLostReportRequest;
import com.campusfind.features.office.dto.SecurityOfficeResponse;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportAuditLogEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportImageEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import com.campusfind.infrastructure.persistence.entity.SecurityOfficerProfileEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportAuditLogRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportImageRepository;
import com.campusfind.infrastructure.persistence.repository.LostReportRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficeRepository;
import com.campusfind.infrastructure.persistence.repository.SecurityOfficerProfileRepository;
import com.campusfind.infrastructure.persistence.repository.UserRepository;
import com.campusfind.infrastructure.storage.StorageService;
import com.campusfind.infrastructure.storage.StoredFile;
import jakarta.persistence.criteria.Predicate;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LostReportService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MAX_IMAGES_PER_REPORT = 3;

    private final LostReportRepository lostReportRepository;
    private final LostReportImageRepository lostReportImageRepository;
    private final LostReportAuditLogRepository lostReportAuditLogRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final LocationRepository locationRepository;
    private final SecurityOfficeRepository securityOfficeRepository;
    private final SecurityOfficerProfileRepository securityOfficerProfileRepository;
    private final StorageService storageService;
    private final AuditService auditService;
    private final String storageBucket;

    public LostReportService(
            LostReportRepository lostReportRepository,
            LostReportImageRepository lostReportImageRepository,
            LostReportAuditLogRepository lostReportAuditLogRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository,
            LocationRepository locationRepository,
            SecurityOfficeRepository securityOfficeRepository,
            SecurityOfficerProfileRepository securityOfficerProfileRepository,
            StorageService storageService,
            AuditService auditService,
            @Value("${app.storage.bucket:campusfind-storage}") String storageBucket) {
        this.lostReportRepository = lostReportRepository;
        this.lostReportImageRepository = lostReportImageRepository;
        this.lostReportAuditLogRepository = lostReportAuditLogRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.locationRepository = locationRepository;
        this.securityOfficeRepository = securityOfficeRepository;
        this.securityOfficerProfileRepository = securityOfficerProfileRepository;
        this.storageService = storageService;
        this.auditService = auditService;
        this.storageBucket = storageBucket;
    }

    @Transactional
    public LostReportResponse createLostReport(String studentEmail, CreateLostReportRequest request) {
        UserEntity student = getUserByEmail(studentEmail);

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

        LostReportEntity entity = new LostReportEntity(
                request.title().trim(),
                request.description().trim(),
                request.distinctiveFeatures() != null ? request.distinctiveFeatures().trim() : null,
                category,
                location,
                request.specificLocation() != null ? request.specificLocation().trim() : null,
                request.lostAt(),
                student,
                office
        );

        LostReportEntity saved = lostReportRepository.save(entity);

        recordAuditLog(saved, student.getId(), student.getRole().name(), "REPORT_CREATED",
                null, LostReportStatus.ACTIVE.name(), "Lost report created by student");

        return mapToResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public Page<LostReportResponse> getMyLostReports(String studentEmail, Pageable pageable) {
        UserEntity student = getUserByEmail(studentEmail);
        Page<LostReportEntity> reports = lostReportRepository.findByStudentIdOrderByCreatedAtDesc(student.getId(), pageable);
        return reports.map(report -> mapToResponse(report, true));
    }

    @Transactional(readOnly = true)
    public LostReportResponse getMyLostReportById(UUID id, String studentEmail) {
        UserEntity student = getUserByEmail(studentEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        // Strict ownership check - return 404 if not owner to prevent enumeration / IDOR
        if (!report.getStudent().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id);
        }

        return mapToResponse(report, true);
    }

    @Transactional
    public LostReportResponse updateLostReport(UUID id, String studentEmail, UpdateLostReportRequest request) {
        UserEntity student = getUserByEmail(studentEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        // Strict ownership check
        if (!report.getStudent().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id);
        }

        // Only active reports can be updated
        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot modify a report with status: " + report.getStatus());
        }

        if (request.title() != null && !request.title().isBlank()) {
            report.setTitle(request.title().trim());
        }
        if (request.description() != null && !request.description().isBlank()) {
            report.setDescription(request.description().trim());
        }
        if (request.distinctiveFeatures() != null) {
            report.setDistinctiveFeatures(request.distinctiveFeatures().trim());
        }
        if (request.categoryId() != null) {
            CategoryEntity category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found: " + request.categoryId()));
            if (!category.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot update report to an inactive category");
            }
            report.setCategory(category);
        }
        if (request.locationId() != null) {
            LocationEntity location = locationRepository.findById(request.locationId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found: " + request.locationId()));
            if (!location.isActive()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot update report to an inactive location");
            }
            report.setLocation(location);
        }
        if (request.specificLocation() != null) {
            report.setSpecificLocation(request.specificLocation().trim());
        }
        if (request.lostAt() != null) {
            report.setLostAt(request.lostAt());
        }

        LostReportEntity updated = lostReportRepository.save(report);

        recordAuditLog(updated, student.getId(), student.getRole().name(), "REPORT_UPDATED",
                report.getStatus().name(), report.getStatus().name(), "Lost report updated by owner");

        return mapToResponse(updated, true);
    }

    @Transactional
    public LostReportResponse cancelLostReport(UUID id, String studentEmail, CancelLostReportRequest request) {
        UserEntity student = getUserByEmail(studentEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        // Strict ownership check
        if (!report.getStudent().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id);
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel a report with status: " + report.getStatus());
        }

        String reason = (request != null && request.cancellationReason() != null) ? request.cancellationReason().trim() : "Cancelled by student";
        report.setStatus(LostReportStatus.CANCELLED);
        report.setCancelledAt(Instant.now());
        report.setCancellationReason(reason);

        LostReportEntity saved = lostReportRepository.save(report);

        recordAuditLog(saved, student.getId(), student.getRole().name(), "REPORT_CANCELLED",
                LostReportStatus.ACTIVE.name(), LostReportStatus.CANCELLED.name(), "Report cancelled by owner: " + reason);

        return mapToResponse(saved, true);
    }

    @Transactional
    public LostReportResponse resolveLostReport(UUID id, String studentEmail, ResolveLostReportRequest request) {
        UserEntity student = getUserByEmail(studentEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        // Strict ownership check
        if (!report.getStudent().getId().equals(student.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id);
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot resolve a report with status: " + report.getStatus());
        }

        String notes = (request != null && request.resolutionNotes() != null) ? request.resolutionNotes().trim() : "Resolved by student";
        Instant now = Instant.now();
        report.setStatus(LostReportStatus.RESOLVED);
        report.setResolvedAt(now);
        report.setResolvedBy(student);
        report.setResolutionNotes(notes);

        LostReportEntity saved = lostReportRepository.save(report);

        recordAuditLog(saved, student.getId(), student.getRole().name(), "REPORT_RESOLVED",
                LostReportStatus.ACTIVE.name(), LostReportStatus.RESOLVED.name(), "Report resolved by owner: " + notes);

        return mapToResponse(saved, true);
    }

    @Transactional
    public LostReportImageResponse uploadImage(UUID lostReportId, String userEmail, MultipartFile file) {
        LostReportEntity report = lostReportRepository.findById(lostReportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + lostReportId));

        UserEntity user = getUserByEmail(userEmail);
        boolean isOwner = report.getStudent().getId().equals(user.getId());
        boolean isOfficer = user.getRole() == UserRole.SECURITY_OFFICER;
        boolean isAdmin = user.getRole() == UserRole.SUPER_ADMIN;

        if (isOfficer) {
            UUID officeId = getOfficerOfficeId(user.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        } else if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot upload images to this lost report");
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot upload images to a report with status: " + report.getStatus());
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

        if (report.getImages().size() >= MAX_IMAGES_PER_REPORT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Maximum of " + MAX_IMAGES_PER_REPORT + " images permitted per lost report");
        }

        String extension = getExtension(file.getOriginalFilename(), contentType);
        String storagePath = "lost-reports/" + lostReportId + "/" + UUID.randomUUID() + extension;

        try {
            StoredFile storedFile = storageService.upload(storageBucket, storagePath, file.getBytes(), contentType);

            LostReportImageEntity imageEntity = new LostReportImageEntity(
                    report,
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "image" + extension,
                    storedFile.storagePath(),
                    storedFile.publicUrl(),
                    contentType,
                    file.getSize()
            );

            LostReportImageEntity saved = lostReportImageRepository.save(imageEntity);

            recordAuditLog(report, user.getId(), user.getRole().name(), "IMAGE_ADDED",
                    report.getStatus().name(), report.getStatus().name(), "Image attached: " + imageEntity.getOriginalFilename());

            return mapToImageResponse(saved);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read image content", e);
        }
    }

    @Transactional
    public void deleteImage(UUID lostReportId, UUID imageId, String userEmail) {
        LostReportEntity report = lostReportRepository.findById(lostReportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + lostReportId));

        UserEntity user = getUserByEmail(userEmail);
        boolean isOwner = report.getStudent().getId().equals(user.getId());
        boolean isOfficer = user.getRole() == UserRole.SECURITY_OFFICER;
        boolean isAdmin = user.getRole() == UserRole.SUPER_ADMIN;

        if (isOfficer) {
            UUID officeId = getOfficerOfficeId(user.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        } else if (!isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Cannot delete image from this lost report");
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete images from a report with status: " + report.getStatus());
        }

        LostReportImageEntity image = lostReportImageRepository.findByIdAndLostReportId(imageId, lostReportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found for report: " + imageId));

        storageService.delete(storageBucket, image.getStoragePath());
        lostReportImageRepository.delete(image);

        recordAuditLog(report, user.getId(), user.getRole().name(), "IMAGE_DELETED",
                report.getStatus().name(), report.getStatus().name(), "Image deleted: " + image.getOriginalFilename());
    }

    // --- Officer APIs ---

    @Transactional(readOnly = true)
    public Page<LostReportResponse> officerSearchLostReports(
            String officerEmail,
            String query,
            LostReportStatus status,
            UUID categoryId,
            UUID locationId,
            Instant fromDate,
            Instant toDate,
            Pageable pageable) {

        UserEntity officer = getUserByEmail(officerEmail);
        UUID officeId = null;

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            officeId = getOfficerOfficeId(officer.getId());
        }

        final UUID finalOfficeId = officeId;

        Specification<LostReportEntity> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // If security officer, strictly enforce office scope
            if (finalOfficeId != null) {
                predicates.add(cb.equal(root.get("designatedSecurityOffice").get("id"), finalOfficeId));
            }

            // Status filter (if specified)
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // Keyword query
            if (query != null && !query.trim().isEmpty()) {
                String pattern = "%" + query.trim().toLowerCase() + "%";
                Predicate titleLike = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                Predicate featuresLike = cb.like(cb.lower(root.get("distinctiveFeatures")), pattern);
                predicates.add(cb.or(titleLike, descLike, featuresLike));
            }

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }

            if (locationId != null) {
                predicates.add(cb.equal(root.get("location").get("id"), locationId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("lostAt"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("lostAt"), toDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<LostReportEntity> results = lostReportRepository.findAll(spec, pageable);
        return results.map(report -> mapToResponse(report, true));
    }

    @Transactional(readOnly = true)
    public LostReportResponse officerGetLostReportById(UUID id, String officerEmail) {
        UserEntity officer = getUserByEmail(officerEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        }

        return mapToResponse(report, true);
    }

    @Transactional
    public LostReportResponse officerResolveLostReport(UUID id, String officerEmail, ResolveLostReportRequest request) {
        UserEntity officer = getUserByEmail(officerEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot resolve a report with status: " + report.getStatus());
        }

        String notes = (request != null && request.resolutionNotes() != null) ? request.resolutionNotes().trim() : "Resolved by security officer";
        Instant now = Instant.now();
        report.setStatus(LostReportStatus.RESOLVED);
        report.setResolvedAt(now);
        report.setResolvedBy(officer);
        report.setResolutionNotes(notes);

        LostReportEntity saved = lostReportRepository.save(report);

        recordAuditLog(saved, officer.getId(), officer.getRole().name(), "REPORT_RESOLVED",
                LostReportStatus.ACTIVE.name(), LostReportStatus.RESOLVED.name(), "Report resolved by officer: " + notes);

        return mapToResponse(saved, true);
    }

    @Transactional
    public LostReportResponse officerCancelLostReport(UUID id, String officerEmail, CancelLostReportRequest request) {
        UserEntity officer = getUserByEmail(officerEmail);
        LostReportEntity report = lostReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + id));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        }

        if (report.getStatus() != LostReportStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot cancel a report with status: " + report.getStatus());
        }

        String reason = (request != null && request.cancellationReason() != null) ? request.cancellationReason().trim() : "Cancelled by security officer";
        report.setStatus(LostReportStatus.CANCELLED);
        report.setCancelledAt(Instant.now());
        report.setCancellationReason(reason);

        LostReportEntity saved = lostReportRepository.save(report);

        recordAuditLog(saved, officer.getId(), officer.getRole().name(), "REPORT_CANCELLED",
                LostReportStatus.ACTIVE.name(), LostReportStatus.CANCELLED.name(), "Report cancelled by officer: " + reason);

        return mapToResponse(saved, true);
    }

    @Transactional(readOnly = true)
    public List<LostReportAuditLogResponse> getAuditHistory(UUID lostReportId, String officerEmail) {
        UserEntity officer = getUserByEmail(officerEmail);
        LostReportEntity report = lostReportRepository.findById(lostReportId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Lost report not found: " + lostReportId));

        if (officer.getRole() == UserRole.SECURITY_OFFICER) {
            UUID officeId = getOfficerOfficeId(officer.getId());
            if (!report.getDesignatedSecurityOffice().getId().equals(officeId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer is not assigned to the designated security office for this report");
            }
        }

        List<LostReportAuditLogEntity> logs = lostReportAuditLogRepository.findByLostReportIdOrderByCreatedAtDesc(lostReportId);
        return logs.stream().map(this::mapToAuditLogResponse).toList();
    }

    // --- Helpers ---

    private void recordAuditLog(
            LostReportEntity report,
            UUID actorId,
            String actorRole,
            String action,
            String previousStatus,
            String newStatus,
            String details) {
        LostReportAuditLogEntity log = new LostReportAuditLogEntity(
                report,
                actorId,
                actorRole,
                action,
                previousStatus,
                newStatus,
                details
        );
        lostReportAuditLogRepository.save(log);

        auditService.recordSuccess(
                actorId,
                null,
                actorRole,
                "LOST_REPORT_" + action,
                "LOST_REPORT",
                report.getId().toString(),
                details);
    }

    private UserEntity getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
    }

    private UUID getOfficerOfficeId(UUID officerId) {
        SecurityOfficerProfileEntity profile = securityOfficerProfileRepository.findById(officerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Officer profile not configured"));
        return profile.getSecurityOffice().getId();
    }

    private LostReportResponse mapToResponse(LostReportEntity entity, boolean includeStudentContact) {
        List<LostReportImageResponse> imageResponses = entity.getImages().stream()
                .map(this::mapToImageResponse)
                .toList();

        StudentContactInfo contactInfo = null;
        if (includeStudentContact && entity.getStudent() != null) {
            contactInfo = new StudentContactInfo(
                    entity.getStudent().getId(),
                    entity.getStudent().getFullName(),
                    entity.getStudent().getEmail(),
                    entity.getStudent().getPhoneNumber()
            );
        }

        return new LostReportResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getDistinctiveFeatures(),
                CategoryResponse.fromEntity(entity.getCategory()),
                LocationResponse.fromEntity(entity.getLocation()),
                entity.getSpecificLocation(),
                entity.getLostAt(),
                SecurityOfficeResponse.fromEntity(entity.getDesignatedSecurityOffice()),
                entity.getStatus(),
                entity.getResolutionNotes(),
                entity.getResolvedAt(),
                entity.getResolvedBy() != null ? entity.getResolvedBy().getId() : null,
                entity.getCancellationReason(),
                entity.getCancelledAt(),
                imageResponses,
                contactInfo,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private LostReportImageResponse mapToImageResponse(LostReportImageEntity entity) {
        return new LostReportImageResponse(
                entity.getId(),
                entity.getOriginalFilename(),
                entity.getPublicUrl(),
                entity.getContentType(),
                entity.getFileSize(),
                entity.getCreatedAt()
        );
    }

    private LostReportAuditLogResponse mapToAuditLogResponse(LostReportAuditLogEntity entity) {
        return new LostReportAuditLogResponse(
                entity.getId(),
                entity.getLostReport().getId(),
                entity.getActorId(),
                entity.getActorRole(),
                entity.getAction(),
                entity.getPreviousStatus(),
                entity.getNewStatus(),
                entity.getDetails(),
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
