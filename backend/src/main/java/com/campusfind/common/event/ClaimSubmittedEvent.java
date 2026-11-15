package com.campusfind.common.event;

import com.campusfind.infrastructure.persistence.entity.ClaimEntity;

public record ClaimSubmittedEvent(
        ClaimEntity claim
) {}
