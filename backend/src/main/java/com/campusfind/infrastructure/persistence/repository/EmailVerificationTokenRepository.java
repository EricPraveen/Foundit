package com.campusfind.infrastructure.persistence.repository;

import com.campusfind.infrastructure.persistence.entity.EmailVerificationTokenEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationTokenEntity, UUID> {

    Optional<EmailVerificationTokenEntity> findByTokenHash(String tokenHash);

    List<EmailVerificationTokenEntity> findAllByUserAndUsedAtIsNull(UserEntity user);
}
