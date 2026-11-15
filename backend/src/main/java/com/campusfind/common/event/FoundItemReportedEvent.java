package com.campusfind.common.event;

import com.campusfind.infrastructure.persistence.entity.FoundItemEntity;

public record FoundItemReportedEvent(
        FoundItemEntity item
) {}
