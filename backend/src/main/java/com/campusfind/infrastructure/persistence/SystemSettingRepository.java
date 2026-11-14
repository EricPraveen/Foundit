package com.campusfind.infrastructure.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSettingEntity, String> {

    Optional<SystemSettingEntity> findByKey(String key);
}
