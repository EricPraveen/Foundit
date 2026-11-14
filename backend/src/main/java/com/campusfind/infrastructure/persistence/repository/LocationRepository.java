package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.LocationEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocationRepository extends JpaRepository<LocationEntity, UUID> {

    List<LocationEntity> findAllByActiveTrueOrderByNameAsc();

    List<LocationEntity> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    Optional<LocationEntity> findByNameIgnoreCase(String name);
}
