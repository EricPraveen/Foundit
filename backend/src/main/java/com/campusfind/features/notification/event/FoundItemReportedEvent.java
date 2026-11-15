package com.campusfind.features.notification.event;

import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;

public record FoundItemReportedEvent(
        FoundItemEntity item
) {}
