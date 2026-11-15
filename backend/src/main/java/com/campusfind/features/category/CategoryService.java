package com.campusfind.features.category;

import com.campusfind.features.audit.AuditService;
import com.campusfind.features.category.dto.CategoryResponse;
import com.campusfind.features.category.dto.CreateCategoryRequest;
import com.campusfind.features.category.dto.UpdateCategoryRequest;
import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import com.campusfind.infrastructure.persistence.repository.CategoryRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    public CategoryService(CategoryRepository categoryRepository, AuditService auditService) {
        this.categoryRepository = categoryRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getActiveCategories() {
        return categoryRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(CategoryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String trimmedName = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A category with this name already exists.");
        }

        boolean active = request.active() == null || request.active();
        CategoryEntity category = new CategoryEntity(trimmedName, request.description(), active);
        CategoryEntity saved = categoryRepository.save(category);

        auditService.recordSuccess(
                null,
                null,
                "SUPER_ADMIN",
                "CATEGORY_CREATED",
                "CATEGORY",
                saved.getId().toString(),
                "Category created: " + saved.getName());

        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found."));

        String trimmedName = request.name().trim();
        categoryRepository.findByNameIgnoreCase(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Another category with this name already exists.");
            }
        });

        category.setName(trimmedName);
        category.setDescription(request.description());
        if (request.active() != null) {
            category.setActive(request.active());
        }

        CategoryEntity saved = categoryRepository.save(category);

        auditService.recordSuccess(
                null,
                null,
                "SUPER_ADMIN",
                "CATEGORY_UPDATED",
                "CATEGORY",
                saved.getId().toString(),
                "Category updated: " + saved.getName());

        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public CategoryResponse setCategoryStatus(UUID id, boolean active) {
        CategoryEntity category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found."));

        category.setActive(active);
        CategoryEntity saved = categoryRepository.save(category);

        auditService.recordSuccess(
                null,
                null,
                "SUPER_ADMIN",
                "CATEGORY_STATUS_CHANGED",
                "CATEGORY",
                saved.getId().toString(),
                "Category active status changed to: " + active);

        return CategoryResponse.fromEntity(saved);
    }
}
