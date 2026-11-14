package com.campusfind.features.category.dto;

import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import java.util.UUID;

public record CategoryResponse(UUID id, String name, String description, boolean active) {

    public static CategoryResponse fromEntity(CategoryEntity entity) {
        return new CategoryResponse(entity.getId(), entity.getName(), entity.getDescription(), entity.isActive());
    }
}
