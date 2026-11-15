package com.campusfind.features.notification.event;

import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;

public record ClaimApprovedEvent(
        ClaimEntity claim,
        UserEntity officer
) {}
