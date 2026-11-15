package com.campusfind.common.event;

import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;

public record ClaimRejectedEvent(
        ClaimEntity claim,
        UserEntity officer,
        String rejectionReason
) {}
