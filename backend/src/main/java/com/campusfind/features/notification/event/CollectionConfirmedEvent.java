package com.campusfind.features.notification.event;

import com.campusfind.infrastructure.persistence.entity.ClaimEntity;
import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.LostReportEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;

public record CollectionConfirmedEvent(
        ClaimEntity claim,
        FoundItemEntity item,
        UserEntity officer,
        LostReportEntity linkedLostReport,
        int pointsAwarded
) {}
