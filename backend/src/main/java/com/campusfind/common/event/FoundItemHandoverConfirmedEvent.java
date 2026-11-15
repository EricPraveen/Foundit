package com.campusfind.common.event;

import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;
import com.campusfind.infrastructure.persistence.entity.UserEntity;

public record FoundItemHandoverConfirmedEvent(
        FoundItemEntity item,
        UserEntity officer,
        int pointsAwarded
) {}
