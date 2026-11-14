package com.campusfind.features.location;

import com.campusfind.features.location.dto.CreateLocationRequest;
import com.campusfind.features.location.dto.LocationResponse;
import com.campusfind.features.location.dto.UpdateLocationRequest;
import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import com.campusfind.infrastructure.persistence.repository.LocationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getActiveLocations() {
        return locationRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(LocationResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LocationResponse> getAllLocations() {
        return locationRepository.findAllByOrderByNameAsc().stream()
                .map(LocationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public LocationResponse createLocation(CreateLocationRequest request) {
        String trimmedName = request.name().trim();
        if (locationRepository.existsByNameIgnoreCase(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A location with this name already exists.");
        }

        boolean active = request.active() == null || request.active();
        String zone = request.campusZone() != null ? request.campusZone().trim() : null;
        LocationEntity location = new LocationEntity(trimmedName, zone, request.description(), active);
        locationRepository.save(location);
        return LocationResponse.fromEntity(location);
    }

    @Transactional
    public LocationResponse updateLocation(UUID id, UpdateLocationRequest request) {
        LocationEntity location = locationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found."));

        String trimmedName = request.name().trim();
        locationRepository.findByNameIgnoreCase(trimmedName).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Another location with this name already exists.");
            }
        });

        location.setName(trimmedName);
        if (request.campusZone() != null) {
            location.setCampusZone(request.campusZone().trim());
        }
        location.setDescription(request.description());
        if (request.active() != null) {
            location.setActive(request.active());
        }

        locationRepository.save(location);
        return LocationResponse.fromEntity(location);
    }

    @Transactional
    public LocationResponse setLocationStatus(UUID id, boolean active) {
        LocationEntity location = locationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found."));

        location.setActive(active);
        locationRepository.save(location);
        return LocationResponse.fromEntity(location);
    }
}
