package com.campusfind.features.notification.event;

import com.campusfind.infrastructure.persistence.entity.ClaimEntity;

public record ClaimSubmittedEvent(
        ClaimEntity claim
) {}
