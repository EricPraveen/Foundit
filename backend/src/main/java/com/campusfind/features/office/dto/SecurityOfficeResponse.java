package com.campusfind.features.office.dto;

import com.campusfind.infrastructure.persistence.entity.SecurityOfficeEntity;
import java.util.UUID;

public record SecurityOfficeResponse(
        UUID id,
        String name,
        String campusLocation,
        String contactEmail,
        String contactPhone,
        String operatingHours,
        boolean active) {

    public static SecurityOfficeResponse fromEntity(SecurityOfficeEntity entity) {
        return new SecurityOfficeResponse(
                entity.getId(),
                entity.getName(),
                entity.getCampusLocation(),
                entity.getContactEmail(),
                entity.getContactPhone(),
                entity.getOperatingHours(),
                entity.isActive());
    }
}
