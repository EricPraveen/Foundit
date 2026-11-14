package com.campusfind.features.location.dto;

import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import java.util.UUID;

public record LocationResponse(
        UUID id,
        String name,
        String campusZone,
        String description,
        boolean active) {

    public static LocationResponse fromEntity(LocationEntity entity) {
        return new LocationResponse(
                entity.getId(),
                entity.getName(),
                entity.getCampusZone(),
                entity.getDescription(),
                entity.isActive());
    }
}
