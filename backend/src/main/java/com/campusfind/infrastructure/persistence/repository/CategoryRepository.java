package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.CategoryEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    List<CategoryEntity> findAllByActiveTrueOrderByNameAsc();

    List<CategoryEntity> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    Optional<CategoryEntity> findByNameIgnoreCase(String name);
}
